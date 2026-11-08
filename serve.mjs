import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const files = {
  "/": ["index.html", "text/html"],
  "/dashboard.css": ["dashboard.css", "text/css"],
  "/fonts/Geist-Variable.woff2": ["fonts/Geist-Variable.woff2", "font/woff2"],
  "/fonts/GeistMono-Variable.woff2": ["fonts/GeistMono-Variable.woff2", "font/woff2"],
  "/dashboard.mjs": ["dashboard.mjs", "text/javascript"],
  "/editorial.mjs": ["editorial.mjs", "text/javascript"],
  "/analytics.mjs": ["analytics.mjs", "text/javascript"],
  "/demo-data.mjs": ["demo-data.mjs", "text/javascript"],
  "/aurora.svg": ["aurora.svg", "image/svg+xml"],
  "/texturas.svg": ["texturas.svg", "image/svg+xml"],
};
const port = Number(process.env.PORT ?? 3021);
createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const file = Object.hasOwn(files, pathname) ? files[pathname] : null;
  if (!file || !["GET", "HEAD"].includes(request.method)) return response.writeHead(404).end();
  try {
    const contents = await readFile(new URL(file[0], import.meta.url));
    const isFont = file[1] === "font/woff2";
    response.writeHead(200, { "Content-Type": isFont ? file[1] : file[1] + "; charset=utf-8",
      "Cache-Control": isFont ? "public, max-age=86400" : "no-store",
      "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : contents);
  } catch {
    response.writeHead(500).end("Não foi possível abrir a prévia.");
  }
}).listen(port, "127.0.0.1", () => console.log("Social Studio em http://127.0.0.1:" + port));
