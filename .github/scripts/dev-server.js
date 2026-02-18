const http = require("http");
const fs = require("fs");
const path = require("path");

const docsDir = path.join(__dirname, "..", "docs");
const mimeTypes = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".json": "application/json", ".png": "image/png" };

const server = http.createServer((req, res) => {
  let filePath = req.url === "/" ? "/index.html" : req.url;
  const fullPath = path.join(docsDir, filePath);
  const ext = path.extname(fullPath);
  fs.readFile(fullPath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found: " + filePath); return; }
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "text/plain" });
    res.end(data);
  });
});

server.listen(8080, "0.0.0.0", () => {
  console.log("Server running at http://localhost:8080");
});
