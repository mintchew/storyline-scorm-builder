const fs = require("fs");
const { readFile } = require("fs/promises");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

async function readJson(relativePath) {
  const fullPath = path.join(projectRoot, relativePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required config file: ${relativePath}`);
  }

  const content = await readFile(fullPath, "utf8");

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
}

async function validateConfiguration({ requireStoryline = true } = {}) {
  const [languages, branding, scorm] = await Promise.all([
    readJson("config/languages.json"),
    readJson("config/branding.json"),
    readJson("config/scorm.json")
  ]);

  if (!Array.isArray(languages) || languages.length === 0) {
    throw new Error("config/languages.json must contain at least one language.");
  }

  const codes = new Set();
  const missing = [];

  for (const language of languages) {
    for (const field of ["code", "english", "native"]) {
      if (!language[field]) {
        throw new Error(`A language entry is missing '${field}'.`);
      }
    }

    if (language.dir && !["ltr", "rtl", "auto"].includes(language.dir)) {
      throw new Error(
        `Invalid text direction '${language.dir}' for ${language.code}. Use ltr, rtl, or auto.`
      );
    }

    if (codes.has(language.code)) {
      throw new Error(`Duplicate language code: ${language.code}`);
    }

    codes.add(language.code);

    const storyPath = path.join(
      projectRoot,
      "storyline",
      "published",
      language.code,
      "story.html"
    );

    if (!fs.existsSync(storyPath)) {
      missing.push(language.code);
    }
  }

  if (requireStoryline && missing.length) {
    throw new Error(
      `Missing story.html for: ${missing.join(", ")}\n` +
        "Publish each Storyline course into storyline/published/<language-code>/."
    );
  }

  return { languages, branding, scorm, missing };
}

if (require.main === module) {
  validateConfiguration()
    .then((result) => {
      console.log(`Validation passed for ${result.languages.length} languages.`);
    })
    .catch((error) => {
      console.error(`Validation failed:\n${error.message}`);
      process.exit(1);
    });
}

module.exports = { validateConfiguration, projectRoot };
