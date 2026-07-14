# Storyline Multilingual Builder — Part 2

Part 2 adds the polished language selector and a preview workflow that works immediately after `npm install`.

## Requirements

- Node.js 18 or newer
- npm

## Setup

Open a terminal in this project folder:

```bash
npm install
```

## Preview

```bash
npm run preview
```

The browser should open automatically at:

```text
http://localhost:3000
```

Preview does not require any Storyline publishes. It generates the launcher configuration automatically.

## Customize the language list

Edit:

```text
config/languages.json
```

English is always placed first. Every other language is sorted alphabetically by its English name.

## Customize the design and labels

Edit:

```text
config/branding.json
```

You can change:

- Page title
- Subtitle
- Confirm-button label
- Colors
- Remembered selection
- Browser-language preselection
- Optional background image

For a background image, copy it into `launcher/assets/` and use a path such as:

```json
"backgroundImage": "assets/background.jpg"
```

## Add Storyline publishes

Publish each language as SCORM 2004 4th Edition.

Copy each complete publish into its matching folder:

```text
storyline/en/
storyline/fr/
storyline/ja/
```

Each folder must contain:

```text
story.html
```

Do not copy the individual Storyline package's `imsmanifest.xml`.

## Validate final content

```bash
npm run validate
```

## Build the final client ZIP

```bash
npm run build
```

The LMS-ready package is created in:

```text
output/multilingual_storyline_scorm2004.zip
```

## Included in Part 2

- Immediate preview with automatic config generation
- Custom Node preview server
- Responsive 4-column language grid
- English first; remaining languages alphabetized
- English name with smaller native-language name
- Selected-state styling
- Confirm button
- Keyboard arrow navigation
- Reduced-motion support
- Remembered language option
- Browser-language preselection option
- SCORM 2004 manifest generation
- Validation and ZIP packaging
