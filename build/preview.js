const http = require("http");
const fs = require("fs");
const {
  cp,
  mkdir,
  rm,
  stat
} = require("fs/promises");
const path = require("path");

const {
  validateConfiguration,
  projectRoot
} = require("./validate");
const {
  createRuntimeConfig,
  writeRuntimeConfig
} = require("./runtime");

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
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".vtt": "text/vtt; charset=utf-8"
};

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function preparePreview() {
  const config = await validateConfiguration({ requireStoryline: false });

  await rm(previewDir, { recursive: true, force: true });
  await mkdir(previewDir, { recursive: true });

  await cp(path.join(projectRoot, "launcher"), previewDir, {
    recursive: true
  });

  const publishedDir = path.join(projectRoot, "storyline", "published");

  if (await pathExists(publishedDir)) {
    await cp(publishedDir, path.join(previewDir, "storyline"), {
      recursive: true
    });
  } else {
    await mkdir(path.join(previewDir, "storyline"), {
      recursive: true
    });
  }

  const runtimeConfig = createRuntimeConfig(config, "storyline");

  await writeRuntimeConfig(
    path.join(previewDir, "runtime-config.js"),
    runtimeConfig
  );

  return config;
}

function safePath(urlPath) {
  const requested = decodeURIComponent(urlPath.split("?")[0]);
  const relative =
    requested === "/" ? "index.html" : requested.replace(/^\/+/, "");
  const fullPath = path.resolve(previewDir, relative);
  const previewRoot = path.resolve(previewDir);

  if (
    fullPath !== previewRoot &&
    !fullPath.startsWith(`${previewRoot}${path.sep}`)
  ) {
    return null;
  }

  return fullPath;
}

async function start() {
  const config = await preparePreview();

  const server = http.createServer(async (request, response) => {
    try {
      const filePath = safePath(request.url || "/");

      if (!filePath) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      let resolved = filePath;

      if (await pathExists(resolved)) {
        const fileStats = await stat(resolved);

        if (fileStats.isDirectory()) {
          resolved = path.join(resolved, "index.html");
        }
      }

      if (!(await pathExists(resolved))) {
        response.writeHead(404, {
          "Content-Type": "text/plain; charset=utf-8"
        });
        response.end("Not found");
        return;
      }

      const extension = path.extname(resolved).toLowerCase();

      response.writeHead(200, {
        "Content-Type":
          mimeTypes[extension] || "application/octet-stream",
        "Cache-Control": "no-store"
      });

      fs.createReadStream(resolved).pipe(response);
    } catch (error) {
      response.writeHead(500, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      response.end("Internal server error");
      console.error(error);
    }
  });

  server.listen(port, () => {
    console.log("");
    console.log("Storyline Multilingual Builder");
    console.log("--------------------------------");
    console.log(`Languages loaded: ${config.languages.length}`);
    console.log(`Missing Storyline publishes: ${config.missing.length}`);

    if (config.missing.length) {
      console.log(`Preview placeholders only: ${config.missing.join(", ")}`);
    }

    console.log(`Preview: http://localhost:${port}`);
    console.log("Open the preview URL in your browser.");
    console.log("Press Ctrl+C to stop.");
    console.log("");
  });
}

start().catch((error) => {
  console.error(`Preview failed:\n${error.stack || error.message}`);
  process.exit(1);
});
