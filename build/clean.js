const fs = require("fs-extra");
const path = require("path");

const root = path.resolve(__dirname, "..");

async function clean() {
  await fs.remove(path.join(root, ".build"));
  await fs.remove(path.join(root, ".preview"));
  await fs.emptyDir(path.join(root, "output"));
  console.log("Generated files removed.");
}

clean().catch((error) => {
  console.error(error);
  process.exit(1);
});
