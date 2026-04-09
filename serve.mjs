import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

const server = http.createServer((req, res) => {
  // Strip query string
  const urlPath = req.url.split("?")[0];
  let filePath = path.join(__dirname, urlPath === "/" ? "index.html" : urlPath);
  filePath = decodeURIComponent(filePath);

  const tryPaths = [
    filePath,
    filePath + ".html",
    path.join(filePath, "index.html"),
  ];

  const tryNext = (paths) => {
    if (!paths.length) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }
    const [current, ...rest] = paths;
    fs.stat(current, (err, stats) => {
      if (err || !stats.isFile()) { tryNext(rest); return; }
      const ext = path.extname(current).toLowerCase();
      const contentType = MIME[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      fs.createReadStream(current).pipe(res);
    });
  };

  tryNext(tryPaths);
});

server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
});
