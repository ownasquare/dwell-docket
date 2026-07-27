import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const portFlag = process.argv.indexOf("--port");
const port = Number(
  portFlag >= 0 ? process.argv[portFlag + 1] : process.env.PORT || 4173,
);
const types = {
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function safePath(pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const resolved = resolve(root, `.${decodeURIComponent(requested)}`);
  return resolved === root || resolved.startsWith(`${root}${sep}`)
    ? resolved
    : null;
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url || "/", "http://127.0.0.1").pathname;
  if (pathname === "/healthz") {
    response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    response.end("ok\n");
    return;
  }

  const path = safePath(pathname);
  if (!path) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const details = await stat(path);
    if (!details.isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": types[extname(path)] || "application/octet-stream",
      "x-content-type-options": "nosniff",
    });
    createReadStream(path).pipe(response);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Dwell Docket is ready at http://127.0.0.1:${port}`);
});
