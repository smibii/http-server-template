import { Accesspoint, Endpoint } from "core/utils/accesspoint";
import path from "path";
import response from "core/utils/response";

const NodeRoot = process.cwd();

const publicDir = path.join(NodeRoot, "public");
const indexFile = path.join(publicDir, "index.html");

export default class Frontend extends Accesspoint {
    constructor() {
        super({
            path: "/"
        });

        new Endpoint({
            method: "GET",
            endpoint: /^.*\..+$/,
            noData: true,
            handler(req, res, data) {
                const url = req.url || "/";
                const filePath = path.join(publicDir, url);
                const ext = path.extname(url).toLowerCase();
                let contentType: string | undefined;
                switch (ext) {
                    case ".svg": contentType = "image/svg+xml"; break;
                    case ".html": contentType = "text/html"; break;
                    case ".js": contentType = "application/javascript"; break;
                    case ".css": contentType = "text/css"; break;
                    case ".png": contentType = "image/png"; break;
                    case ".jpg":
                    case ".jpeg": contentType = "image/jpeg"; break;
                    default: contentType = "application/octet-stream";
                }
                response.sendFile(res, filePath, contentType);
            }}).append(this);

        new Endpoint({
            method: "GET",
            endpoint: /.*/,
            noData: true,
            handler(req, res, data) {
                response.sendFile(res, indexFile, "text/html");
            }}).append(this);
    }
}