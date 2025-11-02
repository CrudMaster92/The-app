const storageKeys = {
  conversations: 'geminiChat.conversations',
  settings: 'geminiChat.settings',
};

const defaultSettings = {
  apiKey: '',
  apiBase: 'https://generativelanguage.googleapis.com/v1beta',
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  ttsVoice: '',
  autoSpeak: false,
};

const state = {
  conversations: [],
  activeConversationId: null,
  settings: { ...defaultSettings },
  pendingAttachments: [],
  recognition: null,
  isListening: false,
  availableVoices: [],
};

const dom = {
  list: document.getElementById('conversationList'),
  listItemTemplate: document.getElementById('conversationListItemTemplate'),
  messageTemplate: document.getElementById('messageTemplate'),
  chatLog: document.getElementById('chatLog'),
  newConversation: document.getElementById('newConversation'),
  activeTitle: document.getElementById('activeConversationTitle'),
  modelBadge: document.getElementById('modelBadge'),
  composerForm: document.getElementById('composerForm'),
  messageInput: document.getElementById('messageInput'),
  sendButton: document.getElementById('sendButton'),
  settingsToggle: document.getElementById('settingsToggle'),
  refreshModels: document.getElementById('refreshModels'),
  settingsPanel: document.getElementById('settingsPanel'),
  settingsForm: document.getElementById('settingsForm'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  apiBaseInput: document.getElementById('apiBaseInput'),
  modelSelect: document.getElementById('modelSelect'),
  temperatureInput: document.getElementById('temperatureInput'),
  temperatureValue: document.getElementById('temperatureValue'),
  voiceSelect: document.getElementById('voiceSelect'),
  resetSettings: document.getElementById('resetSettings'),
  audioToggle: document.getElementById('audioToggle'),
  ttsToggle: document.getElementById('ttsToggle'),
  attachmentPreview: document.getElementById('attachmentPreview'),
  imageInput: document.getElementById('imageInput'),
};

function generateId(prefix) {
  if (typeof globalThis !== 'undefined') {
    const { crypto: cryptoApi } = globalThis;
    if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
      return cryptoApi.randomUUID();
    }
  }
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}-${unique}` : unique;
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(storageKeys.settings);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.settings = { ...defaultSettings, ...parsed };
  } catch (error) {
    console.warn('Failed to parse settings', error);
    state.settings = { ...defaultSettings };
  }
}

function persistSettings() {
  localStorage.setItem(storageKeys.settings, JSON.stringify(state.settings));
}

function loadConversations() {
  try {
    const raw = localStorage.getItem(storageKeys.conversations);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      state.conversations = parsed;
    }
  } catch (error) {
    console.warn('Failed to parse conversations', error);
    state.conversations = [];
  }
}

function persistConversations() {
  localStorage.setItem(storageKeys.conversations, JSON.stringify(state.conversations));
}

function createConversation() {
  const id = generateId('conv');
  const conversation = {
    id,
    title: 'New conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
  state.conversations.unshift(conversation);
  state.activeConversationId = id;
  persistConversations();
  renderConversations();
  renderActiveConversation();
}

function getActiveConversation() {
  return state.conversations.find((conversation) => conversation.id === state.activeConversationId) || null;
}

function setActiveConversation(id) {
  state.activeConversationId = id;
  const conversation = getActiveConversation();
  if (conversation) {
    dom.activeTitle.textContent = conversation.title || 'Conversation';
  }
  renderConversations();
  renderActiveConversation();
}

function updateConversationMetadata(conversation) {
  if (!conversation) return;
  const firstUserMessage = conversation.messages.find((message) => message.role === 'user');
  if (firstUserMessage && firstUserMessage.content) {
    const title = firstUserMessage.content.trim().split('\n')[0].slice(0, 60);
    conversation.title = title || 'Conversation';
  }
  conversation.updatedAt = new Date().toISOString();
}

function renderConversations() {
  dom.list.innerHTML = '';
  if (state.conversations.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No conversations yet. Start a new one!';
    dom.list.appendChild(empty);
    return;
  }
  state.conversations.forEach((conversation) => {
    const itemFragment = dom.listItemTemplate.content.cloneNode(true);
    const button = itemFragment.querySelector('.conversation-item');
    const title = itemFragment.querySelector('.item-title');
    const meta = itemFragment.querySelector('.item-meta');
    title.textContent = conversation.title;
    const updated = new Date(conversation.updatedAt || conversation.createdAt);
    meta.textContent = `Updated ${updated.toLocaleString()}`;
    if (conversation.id === state.activeConversationId) {
      button.classList.add('is-active');
    }
    button.addEventListener('click', () => setActiveConversation(conversation.id));
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      if (confirm('Delete this conversation?')) {
        deleteConversation(conversation.id);
      }
    });
    dom.list.appendChild(itemFragment);
  });
}

function deleteConversation(id) {
  const index = state.conversations.findIndex((conversation) => conversation.id === id);
  if (index !== -1) {
    state.conversations.splice(index, 1);
    if (state.activeConversationId === id) {
      state.activeConversationId = state.conversations[0]?.id || null;
    }
    persistConversations();
    renderConversations();
    renderActiveConversation();
  }
}

function formatTimestamp(iso) {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    return date.toLocaleString();
  } catch (error) {
    return '';
  }
}

function renderActiveConversation() {
  const conversation = getActiveConversation();
  dom.chatLog.innerHTML = '';
  if (!conversation) {
    dom.activeTitle.textContent = 'New Conversation';
    dom.modelBadge.textContent = state.settings.model ? `Model · ${state.settings.model}` : '';
    return;
  }
  dom.activeTitle.textContent = conversation.title || 'Conversation';
  dom.modelBadge.textContent = state.settings.model ? `Model · ${state.settings.model}` : '';
  conversation.messages.forEach((message) => {
    const messageFragment = dom.messageTemplate.content.cloneNode(true);
    const article = messageFragment.querySelector('.message');
    const avatar = messageFragment.querySelector('.avatar');
    const body = messageFragment.querySelector('.content-body');
    const meta = messageFragment.querySelector('.content-meta');
    article.classList.add(message.role === 'user' ? 'user' : 'assistant');
    avatar.textContent = message.role === 'user' ? '🙂' : '∑';
    body.textContent = message.content;
    if (Array.isArray(message.attachments)) {
      message.attachments
        .filter((attachment) => attachment.type === 'image' && attachment.data)
        .forEach((attachment) => {
          const img = document.createElement('img');
          img.src = attachment.data;
          img.alt = attachment.name || 'image attachment';
          img.className = 'attachment';
          body.appendChild(img);
        });
    }
    meta.textContent = formatTimestamp(message.createdAt);
    dom.chatLog.appendChild(messageFragment);
  });
  dom.chatLog.scrollTop = dom.chatLog.scrollHeight;
}

function autoSizeMessageInput() {
  dom.messageInput.style.height = 'auto';
  dom.messageInput.style.height = `${Math.min(dom.messageInput.scrollHeight, 200)}px`;
}

dom.messageInput.addEventListener('input', autoSizeMessageInput);
dom.messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    dom.sendButton.click();
  }
});

dom.composerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const content = dom.messageInput.value.trim();
  const attachments = [...state.pendingAttachments];
  if (!content && attachments.length === 0) {
    return;
  }
  let conversation = getActiveConversation();
  if (!conversation) {
    createConversation();
    conversation = getActiveConversation();
  }
  const message = {
    id: generateId('msg'),
    role: 'user',
    content,
    attachments,
    createdAt: new Date().toISOString(),
  };
  conversation.messages.push(message);
  updateConversationMetadata(conversation);
  state.pendingAttachments = [];
  dom.messageInput.value = '';
  dom.attachmentPreview.innerHTML = '';
  autoSizeMessageInput();
  persistConversations();
  renderConversations();
  renderActiveConversation();
  await respondToConversation(conversation);
});

async function respondToConversation(conversation) {
  const placeholderId = generateId('pending');
  const pendingMessage = {
    id: placeholderId,
    role: 'assistant',
    content: 'Thinking…',
    createdAt: new Date().toISOString(),
    pending: true,
  };
  conversation.messages.push(pendingMessage);
  updateConversationMetadata(conversation);
  persistConversations();
  renderConversations();
  renderActiveConversation();
  try {
    const reply = await fetchAssistantResponse(conversation.messages);
    const responseMessage = {
      id: generateId('assistant'),
      role: 'assistant',
      content: reply,
      createdAt: new Date().toISOString(),
    };
    const index = conversation.messages.findIndex((message) => message.id === placeholderId);
    if (index !== -1) {
      conversation.messages.splice(index, 1, responseMessage);
    }
    updateConversationMetadata(conversation);
    persistConversations();
    renderConversations();
    renderActiveConversation();
    speakIfEnabled(responseMessage.content);
  } catch (error) {
    const index = conversation.messages.findIndex((message) => message.id === placeholderId);
    if (index !== -1) {
      conversation.messages.splice(index, 1);
    }
    const errorMessage = {
      id: generateId('error'),
      role: 'assistant',
      content: `Unable to fetch response: ${error.message}`,
      createdAt: new Date().toISOString(),
    };
    conversation.messages.push(errorMessage);
    updateConversationMetadata(conversation);
    persistConversations();
    renderConversations();
    renderActiveConversation();
  }
}

async function fetchAssistantResponse(messages) {
  const { apiKey, apiBase, model, temperature } = state.settings;
  if (!apiKey) {
    return offlineResponse(messages);
  }
  const url = `${(apiBase || '').replace(/\/$/, '')}/models/${model}:generateContent?key=${apiKey}`;
  const payload = {
    contents: messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => {
        const parts = [{ text: message.content }];
        if (Array.isArray(message.attachments)) {
          message.attachments.forEach((attachment) => {
            if (attachment.type === 'image' && attachment.data) {
              const base64Data = attachment.data.split(',')[1];
              parts.push({
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data,
                },
              });
            }
          });
        }
        return {
          role: message.role === 'assistant' ? 'model' : 'user',
          parts,
        };
      }),
    generationConfig: {
      temperature,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status} ${response.statusText} — ${errorText}`);
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) {
    return text.trim();
  }
  return offlineResponse(messages);
}

function offlineResponse(messages) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  if (!lastUserMessage) {
    return 'Hello! I am ready to chat once you send a message.';
  }
  const attachmentSummary = Array.isArray(lastUserMessage.attachments) && lastUserMessage.attachments.length > 0
    ? ` You also attached ${lastUserMessage.attachments.length === 1 ? 'an image' : `${lastUserMessage.attachments.length} images`}.`
    : '';
  return `I am running in offline mode. You said: "${lastUserMessage.content}".${attachmentSummary} Imagine a fully powered assistant responding here when connected to the API.`;
}

function renderAttachmentsPreview() {
  dom.attachmentPreview.innerHTML = '';
  state.pendingAttachments.forEach((attachment, index) => {
    const container = document.createElement('div');
    container.className = 'preview-item';
    const image = document.createElement('img');
    image.src = attachment.data;
    image.alt = attachment.name || `attachment-${index + 1}`;
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = '×';
    removeButton.addEventListener('click', () => {
      state.pendingAttachments.splice(index, 1);
      renderAttachmentsPreview();
    });
    container.appendChild(image);
    container.appendChild(removeButton);
    dom.attachmentPreview.appendChild(container);
  });
}

dom.imageInput.addEventListener('change', async (event) => {
  const { files } = event.target;
  if (!files || files.length === 0) return;
  const file = files[0];
  const reader = new FileReader();
  reader.onload = () => {
    state.pendingAttachments.push({
      type: 'image',
      name: file.name,
      data: reader.result,
    });
    renderAttachmentsPreview();
  };
  reader.readAsDataURL(file);
  dom.imageInput.value = '';
});

function populateSettingsForm() {
  dom.apiKeyInput.value = state.settings.apiKey;
  dom.apiBaseInput.value = state.settings.apiBase;
  dom.temperatureInput.value = state.settings.temperature;
  dom.temperatureValue.textContent = state.settings.temperature.toFixed(1);
  dom.ttsToggle.setAttribute('aria-pressed', state.settings.autoSpeak ? 'true' : 'false');
  dom.ttsToggle.textContent = state.settings.autoSpeak ? '🔊 Stop reading' : '🔊 Read replies';
  populateModelSelect(state.settings.model);
  populateVoices();
  dom.voiceSelect.value = state.settings.ttsVoice;
}

dom.temperatureInput.addEventListener('input', () => {
  dom.temperatureValue.textContent = Number(dom.temperatureInput.value).toFixed(1);
});

dom.settingsToggle.addEventListener('click', () => {
  populateSettingsForm();
  if (state.settings.apiKey) {
    refreshModelsList();
  }
  dom.settingsPanel.showModal();
});

dom.settingsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.settings = {
    ...state.settings,
    apiKey: dom.apiKeyInput.value.trim(),
    apiBase: dom.apiBaseInput.value.trim() || defaultSettings.apiBase,
    model: dom.modelSelect.value || defaultSettings.model,
    temperature: Number(dom.temperatureInput.value),
    ttsVoice: dom.voiceSelect.value,
  };
  persistSettings();
  dom.settingsPanel.close();
  renderActiveConversation();
});

dom.settingsForm.addEventListener('reset', () => {
  setTimeout(() => dom.settingsPanel.close(), 0);
});

dom.resetSettings.addEventListener('click', () => {
  state.settings = { ...defaultSettings };
  persistSettings();
  populateSettingsForm();
});

dom.refreshModels.addEventListener('click', () => {
  refreshModelsList();
});

async function refreshModelsList() {
  populateModelSelect(state.settings.model, { loading: true });
  try {
    const models = await fetchModels();
    populateModelSelect(state.settings.model, { models });
  } catch (error) {
    console.warn('Failed to fetch models', error);
    populateModelSelect(state.settings.model);
    alert(`Unable to refresh models: ${error.message}`);
  }
}

async function fetchModels() {
  const { apiKey, apiBase } = state.settings;
  if (!apiKey) {
    throw new Error('API key required to load models');
  }
  const url = `${(apiBase || '').replace(/\/$/, '')}/models?key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText} — ${text}`);
  }
  const data = await response.json();
  const items = data?.models;
  if (!Array.isArray(items)) {
    throw new Error('Unexpected model payload');
  }
  return items
    .map((item) => item.name.replace('models/', ''))
    .filter((id) => typeof id === 'string' && id.startsWith('gemini'))
    .sort((a, b) => a.localeCompare(b));
}

function populateModelSelect(selectedModel, options = {}) {
  const { models = null, loading = false } = options;
  dom.modelSelect.innerHTML = '';
  let entries = models;
  if (!entries) {
    entries = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];
  }
  if (loading) {
    const option = document.createElement('option');
    option.textContent = 'Loading…';
    option.value = selectedModel || entries[0];
    dom.modelSelect.appendChild(option);
    dom.modelSelect.disabled = true;
    return;
  }
  dom.modelSelect.disabled = false;
  if (selectedModel && !entries.includes(selectedModel)) {
    entries = [selectedModel, ...entries];
  }
  entries.forEach((model) => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    dom.modelSelect.appendChild(option);
  });
  if (selectedModel) {
    dom.modelSelect.value = selectedModel;
  }
}

function initVoices() {
  if (!('speechSynthesis' in window)) return;
  const voicesChanged = () => {
    state.availableVoices = window.speechSynthesis.getVoices();
    populateVoices();
  };
  window.speechSynthesis.addEventListener('voiceschanged', voicesChanged);
  voicesChanged();
}

function populateVoices() {
  dom.voiceSelect.innerHTML = '';
  const fallback = document.createElement('option');
  fallback.value = '';
  fallback.textContent = 'System default';
  dom.voiceSelect.appendChild(fallback);
  state.availableVoices.forEach((voice) => {
    const option = document.createElement('option');
    option.value = voice.name;
    option.textContent = `${voice.name} · ${voice.lang}`;
    dom.voiceSelect.appendChild(option);
  });
  if (state.settings.ttsVoice) {
    dom.voiceSelect.value = state.settings.ttsVoice;
  }
}

dom.ttsToggle.addEventListener('click', () => {
  const next = !state.settings.autoSpeak;
  state.settings.autoSpeak = next;
  dom.ttsToggle.setAttribute('aria-pressed', next ? 'true' : 'false');
  dom.ttsToggle.textContent = next ? '🔊 Stop reading' : '🔊 Read replies';
  persistSettings();
});

function speakIfEnabled(text) {
  if (!state.settings.autoSpeak || !('speechSynthesis' in window)) return;
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = state.availableVoices.find((item) => item.name === state.settings.ttsVoice);
  if (voice) {
    utterance.voice = voice;
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    dom.audioToggle.disabled = true;
    dom.audioToggle.textContent = '🎙 Unsupported';
    return;
  }
  state.recognition = new SpeechRecognition();
  state.recognition.lang = 'en-US';
  state.recognition.interimResults = true;
  state.recognition.continuous = true;

  let interimTranscript = '';

  state.recognition.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript = transcript;
      }
    }
    if (finalTranscript) {
      dom.messageInput.value = `${dom.messageInput.value} ${finalTranscript}`.trim();
      autoSizeMessageInput();
    }
  };

  state.recognition.onerror = (event) => {
    console.warn('Speech recognition error', event.error);
    stopListening();
  };

  state.recognition.onend = () => {
    if (state.isListening) {
      stopListening();
    }
  };
}

function startListening() {
  if (!state.recognition || state.isListening) return;
  try {
    state.recognition.start();
    state.isListening = true;
    dom.audioToggle.setAttribute('aria-pressed', 'true');
    dom.audioToggle.textContent = '🎙 Listening…';
  } catch (error) {
    console.warn('Failed to start recognition', error);
    stopListening();
  }
}

function stopListening() {
  if (!state.recognition) return;
  state.isListening = false;
  dom.audioToggle.setAttribute('aria-pressed', 'false');
  dom.audioToggle.textContent = '🎙 Start voice';
  try {
    state.recognition.stop();
  } catch (error) {
    console.warn('Failed to stop recognition', error);
  }
}

dom.audioToggle.addEventListener('click', () => {
  if (!state.recognition) return;
  if (state.isListening) {
    stopListening();
  } else {
    startListening();
  }
});

function init() {
  loadSettings();
  loadConversations();
  if (state.conversations.length === 0) {
    createConversation();
  } else {
    state.activeConversationId = state.conversations[0].id;
  }
  renderConversations();
  renderActiveConversation();
  populateSettingsForm();
  initVoices();
  initSpeechRecognition();
  autoSizeMessageInput();
}

dom.newConversation.addEventListener('click', () => {
  createConversation();
  dom.messageInput.focus();
});

window.addEventListener('load', () => {
  init();
});

window.addEventListener('beforeunload', () => {
  if (state.recognition && state.isListening) {
    stopListening();
  }
});
