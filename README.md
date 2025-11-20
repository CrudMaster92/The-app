# The App

This repository contains a modular Chrome extension. The popup hosts a simple applet picker so features can live in their own folders without changing the popup shell.

## Structure
- `manifest.json` – Chrome extension manifest (v3).
- `popup.html`, `popup.js`, `popup.css` – Shared popup shell that lists and loads applets.
- `applets/` – Self-contained features. Add new applets by creating a folder with its own `applet.js` export.

> Note: Do not add icons or other binary assets (e.g., PNG files) to this repository. Keep the extension lightweight and text-only.

## Current applets
- **Font Picker** (`applets/font-picker/`): choose a font family and size, preview live text, and copy the CSS snippet for reuse.
- **Theme Selector** (`applets/theme-selector/`): swap between curated palettes, tweak brightness/accent modifiers, and copy the resulting CSS variables.
- **Conversation Insights** (`applets/conversation-insights/`): capture live ChatGPT metrics (turn counts, words, token estimate), highlight the newest assistant reply, and copy a markdown export of the thread.

## Load the extension locally
1. Run `npm install` if your applets eventually need bundling (not required for the current vanilla setup).
2. In Chrome, open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select this repository folder. The popup will appear when you click the extension icon.
