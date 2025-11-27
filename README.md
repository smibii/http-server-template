# Http Server Template

A simple and extensible Express server template with dynamic endpoints and accesspoint registration. Designed to be easy to use, modular, and ready for frontend integration.

---

## Project name & author

**Project:** Http Server Template
**Author:** SMIBII

---

## Features

* Dynamic endpoint matching with URL parameters
* Accesspoint system with optional subdomains and path prefixes
* Automatic request logging with IP and user-agent
* CORS enabled by default
* Frontend file serving from `/public`
* Easy-to-register endpoints and accesspoints
* Node.js v21+ requirement

---

## Requirements

* **Node.js** version **21 or higher**
* npm (Node Package Manager)

---

## Installation

```bash
# Install dependencies
npm i
```

---

## Running in Development

```bash
# Start the server in development mode
npm run start
```

**Accesspoints in development:**

```
http://localhost:<PORT>/<accesspoint>
```

Frontend static files under `/public` are served automatically.

---

## Building the Project

```bash
# Compile TypeScript and handle aliases
npm run build
```

Build output will be placed into the configured output directory (commonly `build/`). The build script runs `tsc` and `tsc-alias` to rewrite path aliases.

---

## Build and Run (Production)

```bash
# Build and then start the server
npm run build:start
```

**Accesspoints in production:**
Expose accesspoints via subdomains or domain routing, e.g.:

```
http://<accesspoint>.<your-domain>/
```

(If you prefer domain/path routing in production, configure reverse proxy/NGINX accordingly.)

---

## Project structure (checked against repo; please confirm)

> I inspected your repository root and `src/` folder. Below is the structure I built from that inspection and from the code snippets you shared. If anything differs (extra folders, different filenames), paste `tree -a` or `ls -R` and I’ll update the README to match exactly.

```
.
├── .gitattributes
├── .gitignore
├── README.md
├── build.bat
├── config.toml
├── nodemon.json
├── package.json
├── tsconfig.json
├── tslint.json
├── src/
│   ├── index.ts                     # Main entry: express setup, request router & server start
│   ├── registry/
│   │   └── index.ts                 # registry.registerAll and register logic
│   ├── core/
│   │   ├── app.ts                   # logger and app-level utilities
│   │   └── utils/
│   │       ├── accesspoint.ts       # Accesspoint / Endpoint / Endpoint matching logic
│   │       └── response.ts          # Standardized response helpers (sendFile, error, success)
│   ├── API/                         # Example API accesspoint
│   │   └── index.ts
│   ├── Auth/                        # Example Auth accesspoint
│   │   └── index.ts
│   ├── Frontend/                    # Frontend accesspoint (serves public/ & index fallback)
│   │   └── index.ts
│   └── public/                      # (not always inside src, but repository contains public/)
│       └── index.html               # Frontend entry (example)
└── public/                          # Static assets served in dev/prod (if present)
```

> Notes:
>
> * Some files may live at `src/core/utils/…` or similar. The README lists the locations used by the code you shared.
> * If you prefer the `public/` folder inside `src/` or at repository root, tell me which and I’ll update the tree.

---

## Usage

### Accesspoints & Endpoints

Accesspoints group endpoints and can define:

* `path` prefix or `RegExp` for path matching
* optional `subdomain` (string or `RegExp`)
* `ignoreUrls` to exclude certain request prefixes
* `endpoints` bucketed by HTTP method (GET/POST/...) where each `Endpoint`:

  * has an `endpoint` (string or `RegExp`)
  * may set `noData` if it doesn’t require extraction
  * provides `extractData(req, res)` to gather request-specific data
  * provides `handler(req, res, data)` which executes the response

Example:

```ts
new Endpoint({
  method: "GET",
  endpoint: "/hello/<name>",
  handler: async (req, res, data) => {
    res.json({ message: `Hello ${data.endpoint.name}` });
  }
}).append(accesspoint);
```

---

## Frontend

* Static assets under `/public` are served automatically.
* The `Frontend` accesspoint serves static files and falls back to `public/index.html` for SPA routing.

---

## Logging & Diagnostics

The server logs:

* Every incoming request (method, URL, client IP, user-agent)
* Registered accesspoints and endpoints (on startup)
* Ignored URLs per accesspoint
* Errors and internal server issues

---

## Notes & Tips

* Node v21+ is required; the project checks the Node major version and exits if the version is too old.
* Run `npm i` before starting.
* Use `call` in Windows batch scripts when invoking `tsc-alias` from a `.bat` to avoid control flow being replaced (e.g. `call tsc -p .` / `call tsc-alias`).
* For production, use a reverse proxy (NGINX, Caddy, Traefik) to map `accesspoint.your-domain.com` to the server and handle TLS.

---

## License

MIT License

---

## Author

Created by SMIBII
