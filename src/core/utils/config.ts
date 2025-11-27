import { DeepKeyOf, IConfig } from "core/types/config.type";
import toml from "./toml";

const isDevelopment = process.env.NODE_ENV === "development";

function defaultConfig(): IConfig {
    const name = 'HTTP Server Template';
    const port = 8080;
    return { name, port }
}

export function get<Key extends DeepKeyOf<IConfig> | undefined, T = any>(
  ...args: Key[]
): Key extends undefined ? IConfig : T {
  let data: any = toml.parseTomlFile<IConfig>('config', defaultConfig());
  if (!args) return data;

  const key = args.join('.');
  if (!has(key)) {
    return null;
  }

  const parts = key.split('.');
  let current = data;

  for (const part of parts) {
    if (current == null || !(part in current)) {
      return undefined as any;
    }
    current = current[part];
  }

  return current;
}

export function has(key: string): boolean {
  const data: any = toml.parseTomlFile<IConfig>('config', defaultConfig());

  const parts = key.split('.');
  let current: any = data;

  for (const part of parts) {
    if (current == null || !(part in current)) {
      return false;
    }
    current = current[part];
  }

  return true;
}

export default {
  isDevelopment,
  get,
  has
}