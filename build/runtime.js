const fs = require("fs-extra");
const path = require("path");

function sortLanguages(languages) {
  return [...languages].sort((a, b) => {
    if (a.code === "en") return -1;
    if (b.code === "en") return 1;
    return a.english.localeCompare(b.english, "en", { sensitivity: "base" });
  });
}

function createRuntimeConfig({ languages, branding }, launchPrefix) {
  return {
    branding,
    languages: sortLanguages(languages).map((language) => ({
      ...language,
      launchPath: `${launchPrefix}/${language.code}/story.html`
    }))
  };
}

function writeRuntimeConfig(outputFile, runtimeConfig) {
  const content =
    `window.LAUNCHER_CONFIG = ${JSON.stringify(runtimeConfig, null, 2)};\n`;
  fs.ensureDirSync(path.dirname(outputFile));
  fs.writeFileSync(outputFile, content, "utf8");
}

module.exports = { createRuntimeConfig, writeRuntimeConfig };
