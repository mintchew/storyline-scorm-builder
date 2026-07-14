const http = require("http");
const fs = require("fs-extra");
const path = require("path");
const open = require("open");
const { validateConfiguration, projectRoot } = require("./validate");
const { createRuntimeConfig, writeRuntimeConfig } = require("./runtime");

const port = Number(process.env.PORT || 3000);
const previewDir = path.join(projectRoot, ".preview");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp"
};

async function preparePreview() {
  const config = validateConfiguration({ requireStoryline: false });

  await fs.remove(previewDir);
  await fs.ensureDir(previewDir);
  await fs.copy(path.join(projectRoot, "launcher"), previewDir);
  await fs.copy(
    path.join(projectRoot, "storyline"),
    path.join(previewDir, "storyline")
  );
  const runtimeConfig = createRuntimeConfig(
    config,
    "storyline"
  );

  writeRuntimeConfig(
    path.join(previewDir, "runtime-config.js"),
    runtimeConfig
  );

  return config;
}

function safePath(urlPath) {
  const requested = decodeURIComponent(urlPath.split("?")[0]);
  const relative = requested === "/" ? "index.html" : requested.replace(/^\/+/, "");
  const fullPath = path.resolve(previewDir, relative);

  if (!fullPath.startsWith(path.resolve(previewDir))) {
    return null;
  }
  return fullPath;
}

async function start() {
  const config = await preparePreview();

  const server = http.createServer(async (request, response) => {
    const filePath = safePath(request.url || "/");
    if (!filePath) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    let resolved = filePath;
    if (await fs.pathExists(resolved) && (await fs.stat(resolved)).isDirectory()) {
      resolved = path.join(resolved, "index.html");
    }

    if (!(await fs.pathExists(resolved))) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(resolved).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
      "Cache-Control": "no-store"
    });

    fs.createReadStream(resolved).pipe(response);
  });

  server.listen(port, async () => {
    console.log("");
    console.log("Storyline Multilingual Builder");
    console.log("--------------------------------");
    console.log(`Languages loaded: ${config.languages.length}`);
    console.log(`Missing Storyline publishes: ${config.missing.length}`);
    if (config.missing.length) {
      console.log(`Preview placeholders only: ${config.missing.join(", ")}`);
    }
    console.log(`Preview: http://localhost:${port}`);
    console.log("Press Ctrl+C to stop.");
    console.log("");

    try {
      await open(`http://localhost:${port}`);
    } catch {
      // Browser opening is convenient but not required.
    }
  });
}

start().catch((error) => {
  console.error(`Preview failed:\n${error.stack || error.message}`);
  process.exit(1);
});
