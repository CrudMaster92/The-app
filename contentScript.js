const STYLE_ID = "modular-applets-styles";
const SOURCE = "modular-applets";

const state = {
  fontFamily: null,
  fontSize: null,
  colors: null,
  highlightTarget: null
};

function findPromptInput() {
  return document.querySelector("textarea#prompt-textarea");
}

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

  const highlightRules = `
    .modular-applet-highlight {
      outline: 2px solid ${state.colors?.accent ?? "#8b5cf6"} !important;
      box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.35);
      border-radius: 14px;
      scroll-margin: 120px;
      position: relative;
    }
  `;

  style.textContent = `${fontRules}\n${fontSizeRules}\n${colorRules}\n${highlightRules}`;
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

function injectPrompt(promptText) {
  const input = findPromptInput();
  if (!input) {
    throw new Error("ChatGPT prompt box not found");
  }
  input.focus();
  input.value = promptText;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.scrollIntoView({ behavior: "smooth", block: "center" });
}

function wordCount(text) {
  return (text.match(/\b[\w'-]+\b/g) ?? []).length;
}

function getMessageElements() {
  return Array.from(document.querySelectorAll("[data-message-author-role]"));
}

function getConversationSnapshot() {
  const messages = getMessageElements().map((element) => {
    const role = element.getAttribute("data-message-author-role") || "assistant";
    const text = element.innerText?.trim() ?? "";
    const codeBlocks = element.querySelectorAll("pre, code.hljs").length;
    return { role, text, codeBlocks, element };
  });

  const userMessages = messages.filter((entry) => entry.role === "user");
  const assistantMessages = messages.filter((entry) => entry.role === "assistant");
  const totalWords = messages.reduce((sum, entry) => sum + wordCount(entry.text), 0);
  const codeBlockCount = messages.reduce((sum, entry) => sum + entry.codeBlocks, 0);

  const latestAssistant = assistantMessages[assistantMessages.length - 1];
  const latestUser = userMessages[userMessages.length - 1];

  const estimatedTokens = Math.max(10, Math.round(totalWords * 1.3));
  const readingMinutes = totalWords ? Math.max(0.1, totalWords / 200) : 0;

  const exportMarkdown = messages
    .map((entry) => {
      const heading = entry.role === "user" ? "User" : "Assistant";
      return `### ${heading}\n${entry.text || "(empty)"}`;
    })
    .join("\n\n");

  const actionableBullets = latestAssistant?.text
    .split("\n")
    .filter((line) => /^\s*[-•\d+\.]/.test(line.trim()))
    .slice(0, 6)
    .map((line) => line.trim());

  return {
    counts: {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      codeBlocks: codeBlockCount,
      words: totalWords
    },
    estimatedTokens,
    readingMinutes,
    latestAssistant: latestAssistant
      ? {
          preview: latestAssistant.text.slice(0, 260),
          words: wordCount(latestAssistant.text)
        }
      : null,
    latestUser: latestUser?.text || null,
    actionableBullets,
    exportMarkdown
  };
}

function highlightLatestAssistant() {
  const assistantMessages = getMessageElements().filter(
    (el) => (el.getAttribute("data-message-author-role") || "assistant") === "assistant"
  );
  const latest = assistantMessages[assistantMessages.length - 1];
  if (!latest) {
    throw new Error("No assistant messages to highlight yet");
  }

  if (state.highlightTarget?.isConnected) {
    state.highlightTarget.classList.remove("modular-applet-highlight");
  }

  latest.classList.add("modular-applet-highlight");
  latest.scrollIntoView({ behavior: "smooth", block: "center" });
  state.highlightTarget = latest;
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

  if (message.type === "INJECT_PROMPT") {
    injectPrompt(message.payload?.prompt ?? "");
    sendResponse?.({ ok: true });
    return true;
  }

  if (message.type === "INSPECT_THREAD") {
    try {
      const snapshot = getConversationSnapshot();
      sendResponse?.({ ok: true, snapshot });
    } catch (error) {
      sendResponse?.({ ok: false, error: error?.message ?? String(error) });
    }
    return true;
  }

  if (message.type === "HIGHLIGHT_LAST_ASSISTANT") {
    try {
      highlightLatestAssistant();
      sendResponse?.({ ok: true });
    } catch (error) {
      sendResponse?.({ ok: false, error: error?.message ?? String(error) });
    }
    return true;
  }
});
