const STYLE_ID = "modular-applets-styles";
const SOURCE = "modular-applets";

const state = {
  fontFamily: null,
  fontSize: null,
  colors: null
};

function ensureStyleElement() {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = "";
    document.head.append(style);
  }
  return style;
}

function sanitizeFontFamily(fontFamily) {
  if (!fontFamily) return null;
  const quote = fontFamily.includes(" ") ? '"' : "";
  return `${quote}${fontFamily}${quote}`;
}

function renderStyles() {
  const style = ensureStyleElement();
  const fontFamily = sanitizeFontFamily(state.fontFamily);
  const fontStack = fontFamily
    ? `${fontFamily}, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
    : null;
  const fontRules = fontStack
    ? `
      main, main *, textarea#prompt-textarea, textarea#prompt-textarea * {
        font-family: ${fontStack} !important;
      }
    `
    : "";
  const fontSizeRules = state.fontSize
    ? `
      main, [data-testid^="conversation-turn-"], textarea#prompt-textarea {
        font-size: ${state.fontSize}px !important;
      }
    `
    : "";
  const colors = state.colors;
  const colorRules = colors
    ? `
      body, #__next, main {
        background: ${colors.bg} !important;
        color: ${colors.text} !important;
      }
      [data-testid="left-sidebar"], nav, header {
        background: ${colors.panel} !important;
        border-color: ${colors.border} !important;
      }
      [data-message-author-role] {
        background: ${colors.panel} !important;
        border: 1px solid ${colors.border} !important;
        color: ${colors.text} !important;
      }
      [data-message-author-role="user"] {
        border-color: ${colors.accent} !important;
      }
      textarea#prompt-textarea {
        background: ${colors.panel} !important;
        color: ${colors.text} !important;
        border-color: ${colors.border} !important;
      }
      button[data-testid="send-button"],
      button[data-testid="fruitjuice-send-button"],
      button[data-testid="fruitjuice-stop-button"],
      button[data-testid="copy-code-button"] {
        background: ${colors.accent} !important;
        color: ${colors.bg} !important;
        border-color: ${colors.accent} !important;
      }
      ::selection {
        background: ${colors.accent};
        color: ${colors.bg};
      }
    `
    : "";

  style.textContent = `${fontRules}\n${fontSizeRules}\n${colorRules}`;
}

function applyFontSettings(payload) {
  if (payload?.fontFamily) {
    state.fontFamily = payload.fontFamily;
  }
  if (payload?.fontSize) {
    state.fontSize = payload.fontSize;
  }
  renderStyles();
}

function applyThemeColors(colors) {
  state.colors = colors ?? null;
  renderStyles();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.source !== SOURCE) {
    return;
  }

  if (message.type === "APPLY_FONT") {
    applyFontSettings(message.payload);
    sendResponse?.({ ok: true });
    return true;
  }

  if (message.type === "APPLY_THEME") {
    applyThemeColors(message.payload);
    sendResponse?.({ ok: true });
    return true;
  }
});
