const {
  mkdir,
  rm
} = require("fs/promises");
const path = require("path");

const root = path.resolve(__dirname, "..");

async function clean() {
  await rm(path.join(root, ".build"), {
    recursive: true,
    force: true
  });

  await rm(path.join(root, ".preview"), {
    recursive: true,
    force: true
  });

  await rm(path.join(root, "output"), {
    recursive: true,
    force: true
  });

  await mkdir(path.join(root, "output"), {
    recursive: true
  });

  console.log("Generated files removed.");
}

clean().catch((error) => {
  console.error(error);
  process.exit(1);
});
