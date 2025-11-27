# Http Server Template

A simple and extensible Express server template with dynamic endpoints and accesspoint registration. Designed to be easy to use, modular, and ready for frontend integration.

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

The server will log all registered accesspoints and available endpoints.
**Accesspoints in development:** `http://localhost:PORT/accesspoint`

Frontend files in `/public` are served automatically.

---

## Building the Project

```bash
# Compile TypeScript and adjust paths
npm run build
```

This generates the build output in the `build` directory and handles static files and environment variables.

---

## Build and Run

```bash
# Build the project and start the server
npm run build:start
```

This is a combination of compiling TypeScript, running `tsc-alias` for path aliases, and starting the server automatically.
**Accesspoints in production:** `http://accesspoint.DOMAIN` (using subdomains if configured)

---

## Project Structure

```
.
├─ core/
│  ├─ app.ts           # Logger and core app utilities
│  ├─ utils/
│  │  ├─ accesspoint.ts # Endpoint and accesspoint helpers
│  │  └─ response.ts   # Response helper functions
├─ registry/           # Accesspoint registry logic
├─ public/             # Frontend static files (served automatically)
├─ API/                # Example API accesspoint
├─ Auth/               # Authentication accesspoint
├─ Frontend/           # Frontend accesspoint
├─ src/                # Main server entry
└─ package.json
```

---

## Usage

### Accesspoints & Endpoints

Each accesspoint can register multiple endpoints with:

* HTTP method (GET, POST, etc.)
* Path string or RegExp
* Optional `noData` for static endpoints
* Data extraction function for request data
* Handler function for sending responses

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

### Frontend

The frontend accesspoint serves:

* All static files under `/public`
* `index.html` for single-page application fallback

---

## Logging

The server logs:

* Incoming requests with method, URL, IP, and user-agent
* Registered accesspoints and endpoints
* Ignored URLs per accesspoint
* Errors and internal server issues

---

## Notes

* Ensure Node.js v21+ is installed.
* Run `npm i` before starting to install dependencies.
* For dev mode, use `npm run start` — accesspoints are accessible at `/accesspoint`.
* For production, build first with `npm run build`, then start with `npm run build:start` — accesspoints are accessible as `accesspoint.DOMAIN`.

---

## License

MIT License

---

## Author

Created by SMIBII
