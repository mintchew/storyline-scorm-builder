const fs = require("fs");
const {
  cp,
  mkdir,
  readdir,
  rm,
  writeFile
} = require("fs/promises");
const path = require("path");
const archiver = require("archiver");

const {
  validateConfiguration,
  projectRoot
} = require("./validate");
const {
  createRuntimeConfig,
  writeRuntimeConfig
} = require("./runtime");
const { generateManifest } = require("./manifest");

const stagingDir = path.join(projectRoot, ".build");
const outputDir = path.join(projectRoot, "output");

async function listFiles(dir, base = dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...(await listFiles(fullPath, base)));
    } else {
      results.push(path.relative(base, fullPath));
    }
  }

  return results;
}

async function zipDirectory(sourceDir, outputFile) {
  await mkdir(path.dirname(outputFile), { recursive: true });

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFile);
    const archive = archiver("zip", {
      zlib: { level: 9 }
    });

    output.on("close", resolve);
    output.on("error", reject);

    archive.on("warning", (error) => {
      if (error.code === "ENOENT") {
        console.warn(error.message);
      } else {
        reject(error);
      }
    });

    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function build() {
  console.log("Validating project...");
  const config = await validateConfiguration();

  console.log("Preparing package...");
  await rm(stagingDir, { recursive: true, force: true });
  await mkdir(stagingDir, { recursive: true });

  await cp(
    path.join(projectRoot, "launcher"),
    path.join(stagingDir, "launcher"),
    { recursive: true }
  );

  await cp(
    path.join(projectRoot, "storyline", "published"),
    path.join(stagingDir, "storyline"),
    {
      recursive: true,
      filter: (source) => {
        const name = path.basename(source);

        return (
          name !== "PLACE_STORYLINE_PUBLISH_HERE.txt" &&
          name !== ".gitkeep"
        );
      }
    }
  );

  const runtimeConfig = createRuntimeConfig(config, "../storyline");

  await writeRuntimeConfig(
    path.join(stagingDir, "launcher", "runtime-config.js"),
    runtimeConfig
  );

  const files = await listFiles(stagingDir);
  const manifest = generateManifest(config.scorm, files);

  await writeFile(
    path.join(stagingDir, "imsmanifest.xml"),
    manifest,
    "utf8"
  );

  await mkdir(outputDir, { recursive: true });

  const outputFile = path.join(outputDir, config.scorm.outputFile);

  await rm(outputFile, { force: true });

  console.log("Creating SCORM ZIP...");
  await zipDirectory(stagingDir, outputFile);

  console.log("");
  console.log("Build complete:");
  console.log(outputFile);
}

build().catch((error) => {
  console.error(`Build failed:\n${error.stack || error.message}`);
  process.exit(1);
});
