import express, { Request, Response } from "express";
import os from "os";
import cors from "cors";

import { logger } from "core/app";
import response from "core/utils/response";
import { getConst, isDevelopment } from "core/utils/const";
import { serviceConstants } from "core/constants/service";
import * as registry from "registy";
import { Accesspoint, Data, Endpoint, Methods } from "core/utils/accesspoint";

// ---------------------- Setup Express ----------------------
const port = getConst<number>(serviceConstants.server.port);
const app = express();

app.use(cors());
app.use(express.json());

app.use((req: any, res: any, next: any) => {
  const ip = req.socket.remoteAddress || "unknown";
  const ua = req.headers["user-agent"] || "unknown";
  logger.info(`Received ${req.method} ${req.url} from ${ip} | UA: ${ua}`);
  next();
});

export function matchEndpoint(
  endpoints: Endpoint[],
  url: string
): { endpoint: Endpoint; data: Data } | null {
  const urlParts = url.split("/").filter(Boolean);

  for (const endpoint of endpoints) {
    const localData: Data = { endpoint: {} };

    if (endpoint.endpoint instanceof RegExp) {
      const match = endpoint.endpoint.exec(url);
      if (match) {
        if (match.groups) Object.assign(localData, match.groups);
        return { endpoint, data: localData };
      }
      continue;
    }

    const expectedParts = endpoint.endpoint.split("/").filter(Boolean);
    if (expectedParts.length !== urlParts.length) continue;

    let matched = true;
    for (let i = 0; i < expectedParts.length; i++) {
      const expected = expectedParts[i];
      const actual = urlParts[i];
      const paramMatch = expected.match(/^<(.+)>$/);
      if (paramMatch) localData.endpoint[paramMatch[1]] = actual;
      else if (expected !== actual) {
        matched = false;
        break;
      }
    }

    if (matched) return { endpoint, data: localData };
  }

  return null;
}

export async function handleRequest(req: Request, res: Response): Promise<void> {
  try {
    let url = (req.path || "/").toLowerCase();
    const method = req.method as Methods;
    const host = req.headers.host || "";
    const subDomain = host.split(".")[0];

    let matchedAccesspoint: Accesspoint | null = null;
    let matchedEndpoint: Endpoint | null = null;
    let data: Data = { endpoint: {} };

    for (const accesspoint of registry.registry) {
      for (const ignoredUrl of accesspoint.ignoreUrls) {
        if (url.startsWith(ignoredUrl)) return;
      }

      const subdomainMatch =
        !accesspoint.subdomain ||
        accesspoint.subdomain === "" ||
        (accesspoint.subdomain instanceof RegExp
          ? accesspoint.subdomain.test(subDomain)
          : accesspoint.subdomain === subDomain);

      let urlMatch: boolean;
      let matchedPrefix = "";

      if (!accesspoint.path || accesspoint.path === "") {
        urlMatch = true;
      } else if (accesspoint.path instanceof RegExp) {
        const match = url.match(accesspoint.path);
        urlMatch = !!match;
        if (match) matchedPrefix = match[0];
      } else {
        urlMatch = url.startsWith(accesspoint.path);
        if (urlMatch) matchedPrefix = accesspoint.path;
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

app.all(/.*/, async (req: any, res: any) => {
  await handleRequest(req, res);
});

app.listen(port, async () => {
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

  logger.info("Registering accesspoints...");
  registry.registerAll();

  logger.info(`Express server with CORS running at http://${isDevelopment ? "localhost" : localIp}:${port}`);
});