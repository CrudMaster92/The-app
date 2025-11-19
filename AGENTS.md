//Introduction

This page should contain all the elements agents will need to build chrome extension features.
The Chrome extension is a modular, it has multiple features, known as applets that can all be selected, from a popup page. The popup page is simple and doesn't change, applets or features should be built around it to avoid breaking other features or applets. Applets and features are self contained in their own folders.

# ChatGPT UI Elements (Selector Reference Only)

## === CORE INPUT ELEMENTS ===

# Message input textarea
textarea#prompt-textarea

# Send message button
button[data-testid="send-button"]

# Stop generating button
button[data-testid="fruitjuice-stop-button"]

# Continue / Regenerate button
button[data-testid="fruitjuice-send-button"]

# File upload button (may vary)
button[data-testid="upload-button"],
input[type="file"]


## === MESSAGE STREAM ===

# Container for all conversation turns
[data-testid^="conversation-turn-"]

# User messages
[data-message-author-role="user"]

# Assistant messages
[data-message-author-role="assistant"]

# Assistant message paragraphs
[data-message-author-role="assistant"] p

# User message paragraphs
[data-message-author-role="user"] p

# Streaming response container
.result-streaming

# Markdown block inside messages
.markdown, .prose, .whitespace-pre-wrap


## === THREAD LIST / SIDEBAR ===

# Whole sidebar container
[data-testid="left-sidebar"]

# "New chat" button
button[data-testid="new-chat-button"],
button[data-testid="create-new-chat-button"]

# Thread list items
[data-testid="chat-history-item"]


## === TOP NAV / HEADER ===

# Header container
header, [data-testid="top-nav"], nav

# Model picker dropdown
button[data-testid="model-switcher"], 
[data-testid="model-picker"]


## === CODE BLOCKS ===

# Code block container
pre, pre code, code.hljs

# Run / Copy buttons inside code blocks
button[data-testid="copy-code-button"]


## === MESSAGES WITH METADATA ===

# Each message bubble wrapper
[data-message-id]

# Avatar wrappers
[data-testid="avatar-user"],
[data-testid="avatar-assistant"]


## === PAGE STRUCTURE ===

# Main content wrapper
main

# Scrollable container for messages
main .overflow-y-auto,

# Global app root
#__next, #root


## === DETECTION HELPERS ===

# Identify when assistant is responding (streaming)
.result-streaming

# Identify latest assistant message
[data-message-author-role="assistant"]:last-of-type

# Identify latest user message
[data-message-author-role="user"]:last-of-type


Additional notes and patterns

Mutation observers – Because ChatGPT is a React app, content is inserted dynamically. A reliable way to detect new responses is to observe the chat container for mutations and then watch for removal of the .result‑streaming class
fogel.dev
.

Scrolling behaviour – Conversation containers use flexbox with vertical scrolling. To ensure the latest message is visible, scroll the main chat area (main or [data-testid^="conversation‑turn-"] parent) to the bottom after sending a prompt.

Role detection – If data‑message‑author‑role is absent (rare), fallback to structural hints: assistant messages are usually followed by .markdown.prose or .assistant, whereas user messages use a lighter background and classes like .user‑message‑bubble‑color
community.openai.com
.

Copy buttons – Each assistant message includes a copy‑to‑clipboard button (SVG icon). It lives inside the message container; its parent may have aria‑label="Copy to clipboard" or a tooltip. Agents can find it via button[aria‑label*="Copy"] if needed.

Keyboard shortcuts – Many features (e.g., toggling dark mode, copying messages) rely on keyboard shortcuts. Since keyboard mapping changes, prefer interacting with visible buttons instead of simulating key presses unless absolutely necessary.
