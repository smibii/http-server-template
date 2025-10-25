import http from "http";
import os from "os";
import { logger } from "core/app";
import response from "core/utils/response";
import { getConst, isDevelopment } from "core/utils/const";
import { serviceConstants } from "core/constants/service";
import * as registry from "registy";
import { Accesspoint, Data, Endpoint, Methods } from "core/utils/accesspoint";

const port: number = getConst<number>(serviceConstants.server.port);
const httpServer = http.createServer();

httpServer.listen(port, () => {
  const interfaces = os.networkInterfaces();
  let localIp = "";

  for (const interfaceName in interfaces) {
    for (const net of interfaces[interfaceName] || []) {
      if (net.family === "IPv4" && !net.internal) {
        localIp = net.address;
        break;
      }
    }
    if (localIp) break;
  }

  if (!localIp) {
    logger.error("Unable to find local IP address.");
    process.exit(1);
  }

  logger.info(`Registering access points...`);
  registry.registerAll();

  logger.info(`Server started at http://${localIp}:${port}`);
});

httpServer.on("request", (req: http.IncomingMessage, res: http.ServerResponse): void => {
  const method = req.method || "GET";
  const ip = req.socket.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  logger.info(`Received ${method} request from ${ip} with User-Agent: ${userAgent} for URL: ${req.url?.toLowerCase()}`);

  if (method === "OPTIONS") {
    response.createHeader(res, 204);
    res.end();
    return;
  }

  if (["GET", "POST", "PUT", "DELETE"].includes(method)) {
    handleRequest(req, res);
    return;
  }

  logger.warn(`Unsupported method: ${method}`);
  response.sendJson(res, { error: "Method not allowed" }, 405);
  return;
});

export function matchEndpoint(
  endpoints: Endpoint[],
  url: string
): { endpoint: Endpoint; data: Data } | null {
  const urlParts = url.split("/").filter(Boolean);

  for (const endpoint of endpoints) {
    const localData: Data = {};

    // Regex endpoint
    if (endpoint.endpoint instanceof RegExp) {
      const match = endpoint.endpoint.exec(url);
      if (match) {
        if (match.groups) Object.assign(localData, match.groups);
        return { endpoint, data: localData };
      }
      continue;
    }

    // String endpoint with <param> support
    const expectedParts = endpoint.endpoint.split("/").filter(Boolean);
    if (expectedParts.length !== urlParts.length) continue;

    let matched = true;
    for (let i = 0; i < expectedParts.length; i++) {
      const expected = expectedParts[i];
      const actual = urlParts[i];
      const paramMatch = expected.match(/^<(.+)>$/);
      if (paramMatch) localData[paramMatch[1]] = actual;
      else if (expected !== actual) {
        matched = false;
        break;
      }
    }

    if (matched) return { endpoint, data: localData };
  }

  return null;
}

export async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  try {
    let url = (req.url || "/").split("?")[0].toLowerCase();
    const method = req.method as Methods;
    const host = req.headers.host || "";
    const subDomain = host.split(".")[0];

    console.log(url)

    let matchedAccesspoint: Accesspoint | null = null;
    let matchedEndpoint: Endpoint | null = null;
    let data: Data = {};

    for (const accesspoint of registry.registry) {
      for (const ignoredUrl of accesspoint.ignoreUrls) {
        if (url.startsWith(ignoredUrl)) {
          return null;
        }
      }

      const subdomainMatch =
        !accesspoint.prod || accesspoint.prod === "" ||
        (accesspoint.prod instanceof RegExp
          ? accesspoint.prod.test(subDomain)
          : accesspoint.prod === subDomain);

      let urlMatch: boolean;
      let matchedPrefix = "";

      if (!accesspoint.local || accesspoint.local === "") {
        urlMatch = true;
      } else if (accesspoint.local instanceof RegExp) {
        const match = url.match(accesspoint.local);
        urlMatch = !!match;
        if (match) matchedPrefix = match[0];
      } else {
        urlMatch = url.startsWith(accesspoint.local);
        if (urlMatch) matchedPrefix = accesspoint.local;
      }

      if (!subdomainMatch && !urlMatch) continue;

      if (urlMatch && isDevelopment && matchedPrefix) {
        url = url.slice(matchedPrefix.length) || "/";
      }

      const endpoints = accesspoint.endpoints.get(method) || [];
      const match = matchEndpoint(endpoints, url);

      if (match) {
        matchedAccesspoint = accesspoint;
        matchedEndpoint = match.endpoint;
        data = { ...data, ...match.data };
        break;
      }
    }

    if (!matchedAccesspoint || !matchedEndpoint) {
      return response.error(res, "invalid_route", 401);
    }

    if (!matchedEndpoint.noData) {
      if (req.headers["content-type"] !== "application/json") {
        return response.error(res, "Content-Type must be application/json", 415);
      }

      const fetchedData = await matchedEndpoint.extractData(req, res);
      data = { ...data, ...fetchedData };
    }

    logger.info(
      `Handling ${method} request for ${url} at accesspoint ${matchedAccesspoint.getBaseUrl()}`
    );
    await matchedEndpoint.handler(req, res, data);
  } catch (err) {
    logger.error(`Error handling request: ${(err as Error).message}`);
    response.error(res, "internal_server_error", 500);
  }
}