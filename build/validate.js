const fs = require("fs-extra");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

function readJson(relativePath) {
  const fullPath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required config file: ${relativePath}`);
  }
  return fs.readJsonSync(fullPath);
}

function validateConfiguration({ requireStoryline = true } = {}) {
  const languages = readJson("config/languages.json");
  const branding = readJson("config/branding.json");
  const scorm = readJson("config/scorm.json");

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

    if (codes.has(language.code)) {
      throw new Error(`Duplicate language code: ${language.code}`);
    }
    codes.add(language.code);

    const storyPath = path.join(
      projectRoot,
      "storyline",
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
      "Publish each Storyline course into storyline/<language-code>/."
    );
  }

  return { languages, branding, scorm, missing };
}

if (require.main === module) {
  try {
    const result = validateConfiguration();
    console.log(`Validation passed for ${result.languages.length} languages.`);
  } catch (error) {
    console.error(`Validation failed:\n${error.message}`);
    process.exit(1);
  }
}

module.exports = { validateConfiguration, projectRoot };
