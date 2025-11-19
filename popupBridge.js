const SOURCE = "modular-applets";

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.id) {
    throw new Error("No active tab found");
  }
  const url = tab.url ?? "";
  if (!url.startsWith("https://chatgpt.com")) {
    throw new Error("Open chatgpt.com to apply these settings.");
  }
  return tab.id;
}

export async function sendMessageToChatGPT(message) {
  const tabId = await getActiveTabId();
  return chrome.tabs.sendMessage(tabId, { ...message, source: SOURCE });
}
