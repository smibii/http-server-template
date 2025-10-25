import { Accesspoint } from "utils/accesspoint";
import * as Frontend from "Frontend";

export const registry: Set<Accesspoint> = new Set<Accesspoint>();

export function register() {
    registry.add(Frontend.register()); // Frontend Accesspoint template
}