import response from "core/utils/response";
import http from "http";
import { isDevelopment } from "core/utils/const";

export type Methods = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
export type DataShape = Record<string, string>;
export type Data = Record<string, any>;

export async function fetchData(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  requiredData: DataShape = {},
  optionalData: DataShape = {}
): Promise<Data> {
  if (req.headers["content-type"] !== "application/json") {
    response.error(res, "Content-Type must be application/json");
    throw new Error("Invalid Content-Type");
  }

  try {
    const body = await new Promise<string>((resolve, reject) => {
      let data = "";
      req.on("data", chunk => (data += chunk));
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });

    const jsonData = JSON.parse(body);
    const result: Data = {};

    const validateKeys = (schema: DataShape, isRequired: boolean) => {
      for (const key in schema) {
        const expectedType = schema[key];
        const value = jsonData[key];

        if (value === undefined) {
          if (isRequired) {
            response.error(res, `Missing required key: ${key}`);
            throw new Error(`Missing required key: ${key}`);
          }
          continue;
        }

        if (typeof value !== expectedType) {
          response.error(
            res,
            `${isRequired ? "Required" : "Optional"} key '${key}' has invalid type (${typeof value}); expected (${expectedType})`
          );
          throw new Error(`Invalid type for ${key}: expected ${expectedType}, got ${typeof value}`);
        }

        result[key] = value;
      }
    };

    validateKeys(requiredData, true);
    validateKeys(optionalData, false);

    return result;
  } catch (err) {
    if (err instanceof SyntaxError) {
      response.error(res, "Invalid JSON body");
    }
    throw err;
  }
}

export type AccesspointOptions = {
  local: string | RegExp;
  prod: string | RegExp;
  ignoreUrls?: string[];
};

export class Accesspoint {
  public local: string | RegExp;
  public prod: string | RegExp;
  public endpoints: Map<Methods, Endpoint[]> = new Map();
  public ignoreUrls: string[];

  constructor(options: AccesspointOptions) {
    this.local = options.local;
    this.prod = options.prod;
    this.ignoreUrls = options.ignoreUrls || [];
  }

  public addEndpoint(endpoint: Endpoint) {
    const method = endpoint.method;
    if (!this.endpoints.has(method)) this.endpoints.set(method, []);
    this.endpoints.get(method)?.push(endpoint);
  }

  public removeEndpoint(endpoint: Endpoint) {
    const method = endpoint.method;
    const endpoints = this.endpoints.get(method);
    if (!endpoints) return;
    this.endpoints.set(
      method,
      endpoints.filter(e => e !== endpoint)
    );
  }

  public getBaseUrl(): string {
    return isDevelopment
      ? typeof this.local === "string" ? this.local : "/"
      : typeof this.prod === "string" ? this.prod : "/";
  }
}

type handlerType = (req: http.IncomingMessage, res: http.ServerResponse, data: Data) => void;

export type EndpointOptions = {
  method: Methods;
  endpoint: string | RegExp;
  handler: handlerType;
  requiredData?: Record<string, any>;
  optionalData?: Record<string, any>;
  noData?: boolean;
  customOptions?: Record<string, any>;
};

export class Endpoint {
  public method: Methods;
  public endpoint: string | RegExp;
  public handler: handlerType;
  public customOptions: Record<string, any>;
  public requiredData: Record<string, any>;
  public optionalData: Record<string, any>;
  public noData: boolean;

  constructor(options: EndpointOptions) {
    this.method = options.method;
    this.endpoint = options.endpoint;
    this.handler = options.handler;
    this.customOptions = options.customOptions || {};
    this.requiredData = options.requiredData || {};
    this.optionalData = options.optionalData || {};
    this.noData = options.noData || false;
  }

  public async extractData(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<Data> {
    if (this.noData) {
      return {};
    }
    return await fetchData(req, res, this.requiredData, this.optionalData);
  }
}