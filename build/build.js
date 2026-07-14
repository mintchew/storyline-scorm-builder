const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const { validateConfiguration, projectRoot } = require("./validate");
const { createRuntimeConfig, writeRuntimeConfig } = require("./runtime");
const { generateManifest } = require("./manifest");

const stagingDir = path.join(projectRoot, ".build");
const outputDir = path.join(projectRoot, "output");

function listFiles(dir, base = dir) {
  const results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...listFiles(fullPath, base));
    } else {
      results.push(path.relative(base, fullPath));
    }
  }

  return results;
}

async function zipDirectory(sourceDir, outputFile) {
  await fs.ensureDir(path.dirname(outputFile));

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFile);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("warning", (error) => {
      if (error.code === "ENOENT") console.warn(error.message);
      else reject(error);
    });
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function build() {
  console.log("Validating project...");
  const config = validateConfiguration();

  console.log("Preparing package...");
  await fs.remove(stagingDir);
  await fs.ensureDir(stagingDir);

  await fs.copy(
    path.join(projectRoot, "launcher"),
    path.join(stagingDir, "launcher")
  );

  await fs.copy(
    path.join(projectRoot, "storyline"),
    path.join(stagingDir, "storyline"),
    {
      filter: (source) => path.basename(source) !== "PLACE_STORYLINE_PUBLISH_HERE.txt"
    }
  );

  const runtimeConfig = createRuntimeConfig(
    config,
    "../storyline"
  );

  writeRuntimeConfig(
    path.join(stagingDir, "launcher", "runtime-config.js"),
    runtimeConfig
  );

  const files = listFiles(stagingDir);
  const manifest = generateManifest(config.scorm, files);
  await fs.writeFile(
    path.join(stagingDir, "imsmanifest.xml"),
    manifest,
    "utf8"
  );

  await fs.ensureDir(outputDir);
  const outputFile = path.join(outputDir, config.scorm.outputFile);
  await fs.remove(outputFile);

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
