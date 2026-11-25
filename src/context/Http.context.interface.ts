export type HttpMethods = "GET" | "POST" | "PUT" | "DELETE";

export interface IHttpContext {
    handle: (request?: any) => void;
}