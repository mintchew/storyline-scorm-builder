(() => {
  "use strict";

  const config = window.LAUNCHER_CONFIG;

  if (!config || !Array.isArray(config.languages)) {
    document.body.innerHTML = "Launcher configuration is missing.";
    return;
  }

  const title = document.getElementById("page-title");
  const subtitle = document.getElementById("page-subtitle");
  const grid = document.getElementById("language-grid");
  const status = document.getElementById("status-message");
  const confirmButton = document.getElementById("confirm-button");

  title.textContent = config.branding.launcherTitle;
  subtitle.textContent = config.branding.launcherSubtitle;
  confirmButton.textContent = config.branding.confirmButtonLabel;

  applyBranding(config.branding);

  let selectedLanguage = null;
  const optionButtons = [];

  for (const language of config.languages) {
    const button = createLanguageButton(language);
    optionButtons.push(button);
    grid.appendChild(button);
  }

  const rememberedCode = config.branding.rememberSelection
    ? localStorage.getItem("storylineLanguage")
    : null;

  if (rememberedCode) {
    const rememberedLanguage = config.languages.find(
      (language) => language.code === rememberedCode
    );

    if (rememberedLanguage) {
      selectLanguage(rememberedLanguage);
    }
  } else if (config.branding.preselectBrowserLanguage) {
    preselectBrowserLanguage();
  }

  confirmButton.addEventListener("click", () => {
    if (!selectedLanguage) return;

    if (config.branding.rememberSelection) {
      localStorage.setItem(
        "storylineLanguage",
        selectedLanguage.code
      );
    }

    window.location.assign(selectedLanguage.launchPath);
  });

  function createLanguageButton(language) {
    const direction = language.dir || "ltr";
    const button = document.createElement("button");

    button.type = "button";
    button.className = "language-option";
    button.dataset.code = language.code;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", "false");
    button.setAttribute(
      "aria-label",
      `${language.english}, ${language.native}`
    );

    const radio = document.createElement("span");
    radio.className = "radio-dot";
    radio.setAttribute("aria-hidden", "true");

    const copy = document.createElement("span");
    copy.className = "language-copy";

    const english = document.createElement("span");
    english.className = "english-name";
    english.textContent = language.english;
    english.lang = "en";
    english.dir = "ltr";

    const native = document.createElement("span");
    native.className = "native-name";
    native.textContent = language.native;
    native.dir = direction;
    native.lang = language.code;

    copy.append(english, native);
    button.append(radio, copy);

    button.addEventListener("click", () => {
      selectLanguage(language);
    });

    button.addEventListener("keydown", (event) => {
      const index = optionButtons.indexOf(button);
      let nextIndex = null;

      if (
        event.key === "ArrowRight" ||
        event.key === "ArrowDown"
      ) {
        nextIndex = (index + 1) % optionButtons.length;
      } else if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowUp"
      ) {
        nextIndex =
          (index - 1 + optionButtons.length) %
          optionButtons.length;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        optionButtons[nextIndex].focus();
      }
    });

    return button;
  }

  function selectLanguage(language) {
    selectedLanguage = language;

    for (const button of optionButtons) {
      button.setAttribute(
        "aria-checked",
        String(button.dataset.code === language.code)
      );
    }

    confirmButton.disabled = false;
    status.textContent = `${language.english} selected.`;
  }

  function preselectBrowserLanguage() {
    const browserCode = (navigator.language || "").toLowerCase();

    const directMatch = config.languages.find(
      (language) =>
        language.code.toLowerCase() === browserCode
    );

    const baseMatch = config.languages.find(
      (language) =>
        language.code.toLowerCase().split("-")[0] ===
        browserCode.split("-")[0]
    );

    const match = directMatch || baseMatch;

    if (match) {
      selectLanguage(match);
    }
  }

  function applyBranding(branding) {
    const colors = branding.colors || {};
    const root = document.documentElement;

    const cssVars = {
      backgroundStart: "--background-start",
      backgroundMiddle: "--background-middle",
      backgroundEnd: "--background-end",
      panel: "--panel",
      card: "--card",
      text: "--text",
      mutedText: "--muted-text",
      border: "--border",
      selectedBorder: "--selected-border",
      accentStart: "--accent-start",
      accentEnd: "--accent-end"
    };

    for (const [key, cssVar] of Object.entries(cssVars)) {
      if (colors[key]) {
        root.style.setProperty(cssVar, colors[key]);
      }
    }

    if (branding.backgroundImage) {
      document.body.style.backgroundImage =
        `linear-gradient(rgba(4, 8, 25, 0.56), ` +
        `rgba(4, 8, 25, 0.72)), ` +
        `url("${branding.backgroundImage}")`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    }
  }
})();
