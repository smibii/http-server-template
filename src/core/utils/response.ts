import http from "http";
import { logger } from "../app";
import fs from "fs";

function createHeader(res: http.ServerResponse, code: number = 200, headers?: http.OutgoingHttpHeaders | http.OutgoingHttpHeader[]): void {
  res.writeHead(code, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...headers
  });
}

function sendJson(res: http.ServerResponse, data: any, code: number = 200): void {
  if (typeof data !== "object") {
    logger.error("Data to send is not an object. Converting to JSON.");
    data = { message: data };
  }
  logger.info(`Sending JSON response with code ${code}: ` + JSON.stringify(data));
  createHeader(res, code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function result(res: http.ServerResponse, data: any, code: number = 200): void {
  sendJson(res, data, code);
}

function error(res: http.ServerResponse, message: string, code: number = 400): void {
  logger.error(`Error: ${message}`);
  result(res, {message, error: true}, code);
}

function sendFile(res: http.ServerResponse, filePath: string, contentType: string = null): void {
  fs.readFile(filePath, (err: NodeJS.ErrnoException | null, data: Buffer) => {
    if (err) {
      logger.error(`Error reading file ${filePath}: ${err.message}`);
      createHeader(res, 404, { "Content-Type": "text/plain" });
      res.end("File not found");
    }
    else {
      logger.info(`Serving file: ${filePath}`);
      createHeader(res, 200, (contentType ? { "Content-Type": contentType } : null));
      res.end(data);
    }
  });
}

export default {
  createHeader,
  sendJson,
  result,
  error,
  sendFile
};