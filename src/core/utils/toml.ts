import { parse, stringify } from 'smol-toml';
import path from 'path';
import fs from 'fs';

const NodeRoot = process.cwd();

function updateConfigFile<T>(relativePath: string, config: T): void {
    const fullPath = path.join(NodeRoot, relativePath + '.toml');
    const fileContents = stringify(config as any);
    fs.writeFileSync(fullPath, fileContents, 'utf-8');
}

export function parseTomlFile<T>(relativePath: string, defaultContent: T): T {
    const fullPath = path.join(NodeRoot, relativePath + '.toml');
    if (!fs.existsSync(fullPath)) updateConfigFile(relativePath, defaultContent);
    const fileContents = fs.readFileSync(fullPath, 'utf-8');
    const { config, hasMissMatch } = validateConfig(parse(fileContents) as T, defaultContent);
    if (hasMissMatch) updateConfigFile(relativePath, config);
    return config;
}

function validateConfig<T>(config: T, defaults: T): { config: T; hasMissMatch: boolean } {
    let hasMissMatch = false;

    function validate(obj: any, def: any): any {
        if (typeof def !== "object" || def === null || Array.isArray(def)) {
            if (typeof obj !== typeof def) {
                hasMissMatch = true;
                return def;
            }
            return obj;
        }
        const result: any = {};
        for (const key in def) {
            if (key in obj) {
                result[key] = validate(obj[key], def[key]);
            } else {
                hasMissMatch = true;
                result[key] = def[key];
            }
        }
        for (const key in obj) {
            if (!(key in def)) {
                hasMissMatch = true;
            }
        }
        return result;
    }

    const merged = validate(config, defaults);


    return {
        config: merged,
        hasMissMatch
    };
}

export default {
    parseTomlFile
};