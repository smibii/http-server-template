import { Accesspoint } from "core/utils/accesspoint";
import { logger } from "core/app";

export const registry: Set<Accesspoint> = new Set<Accesspoint>();

import * as Frontend from "Frontend";

export function registerAll() {
    register(Frontend.register());
}

// Register and logging logic
function register(accesspoint: Accesspoint) {
    logger.info(`Registered accesspoint at local: ${getStringified(accesspoint.path)} build: ${getStringified(accesspoint.subdomain || null)}`);
    logger.info(` - with ${accesspoint.endpoints.size} methods.`);
    accesspoint.endpoints.forEach((endpoints, method) => {
        logger.info(`   - ${method}: ${endpoints.length} endpoints.`);
        endpoints.forEach((endpoint) => {
            logger.info(`     - ${getStringified(endpoint.endpoint)}`);
            logger.info(`     - noData: ${endpoint.noData || false}`);
            if (!endpoint.noData) {
                logger.info(`       - requiredData: ${Object.keys(endpoint.requiredData).length}`);
                Object.keys(endpoint.requiredData).forEach((key) => {
                    logger.info(`         - ${key}: ${endpoint.requiredData[key]}`);
                });
                logger.info(`       - optionalData: ${Object.keys(endpoint.optionalData || {}).length}`);
                Object.keys(endpoint.optionalData || {}).forEach((key) => {
                    logger.info(`         - ${key}: ${endpoint.optionalData![key]}`);
                });
            }
        });
    });
    logger.info(` - ignoring ${accesspoint.ignoreUrls?.length || 0} urls.`);
    accesspoint.ignoreUrls.forEach((url) => {
        logger.info(`     - ${url}`);
    });
    registry.add(accesspoint);
}

function getStringified(message: string | RegExp): string {
    const isRegExp = message instanceof RegExp;
    return isRegExp ? `${message}` : `"${message}"`;
}