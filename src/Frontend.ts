import { Accesspoint, Endpoint } from "utils/accesspoint";
import path from "path";
import { sendFile } from "core/response";

const publicDir = path.join(__dirname, "../public");
const indexFile = path.join(publicDir, "index.html");

export function register(): Accesspoint {
    const frontendAP = new Accesspoint({
        local: /.*/,
        prod: null
    });

    frontendAP.addEndpoint(
        new Endpoint({
            method: "GET",
            endpoint: /^\/.*\.[^/]+$/,
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

                sendFile(res, filePath, contentType);
            }
        })
    );

    frontendAP.addEndpoint(
        new Endpoint({
            method: "GET",
            endpoint: /.*/,
            noData: true,
            handler(req, res, data) {
                sendFile(res, indexFile, "text/html");
            }
        })
    );

  return frontendAP;
}
