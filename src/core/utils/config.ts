import { IConfig } from "core/types/config.type";
import toml from "./toml";

export const isDevelopment = process.env.NODE_ENV === "development";
export const defaultConfig: IConfig = {
    port: 8080,
    name: 'HTTP Server Template'
}

export function config(): IConfig {
    const data = toml.parseTomlFile<IConfig>('config', defaultConfig);
    return data;
}

export function configGet<T>(key: keyof IConfig) {
    const data: IConfig = config();
    if (!(key in data)) return null;
    return data[key] as T;
}