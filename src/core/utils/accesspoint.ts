import { Request, Response } from "express";
import response from "core/utils/response";
import { isDevelopment } from "core/utils/const";

/* -------------------------------------------------------------------------- */
/*                                Type Definitions                            */
/* -------------------------------------------------------------------------- */

export type Methods = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
export type DataShape = Record<string, string>;
export type Data = { [key: string]: any; endpoint: Record<string, any> };

/* -------------------------------------------------------------------------- */
/*                                Data Extractor                              */
/* -------------------------------------------------------------------------- */

/**
 * Validates and extracts JSON body data from an Express request.
 * Replaces the manual http parsing logic from the old version.
 */
export async function fetchData(
  req: Request,
  res: Response,
  requiredData: DataShape = {},
  optionalData: DataShape = {}
): Promise<Data> {
  if (!req.is("application/json")) {
    response.error(res, "Content-Type must be application/json");
    throw new Error("Invalid Content-Type");
  }

  const jsonData = req.body;
  if (typeof jsonData !== "object" || jsonData === null) {
    response.error(res, "Invalid JSON body");
    throw new Error("Invalid JSON body");
  }

  const result: Data = { endpoint: {} };

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
}

/* -------------------------------------------------------------------------- */
/*                               Accesspoint Class                            */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                               Endpoint Class                               */
/* -------------------------------------------------------------------------- */

type HandlerType = (req: Request, res: Response, data: Data) => void | Promise<void>;

export type EndpointOptions = {
  method: Methods;
  endpoint: string | RegExp;
  handler: HandlerType;
  requiredData?: Record<string, any>;
  optionalData?: Record<string, any>;
  noData?: boolean;
  customOptions?: Record<string, any>;
};

export class Endpoint {
  public method: Methods;
  public endpoint: string | RegExp;
  public handler: HandlerType;
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

  public async extractData(req: Request, res: Response): Promise<Data> {
    if (this.noData) return { endpoint: {} };
    return await fetchData(req, res, this.requiredData, this.optionalData);
  }
}