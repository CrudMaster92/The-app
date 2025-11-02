const storageKeys = {
  settings: 'booleanBuilder.settings',
};

const defaultSettings = {
  apiKey: '',
  apiBase: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  temperature: 0.4,
};

const dom = {
  must: document.getElementById('mustInclude'),
  phrases: document.getElementById('exactPhrases'),
  any: document.getElementById('anyTerms'),
  exclude: document.getElementById('excludeTerms'),
  sitePreset: document.getElementById('sitePreset'),
  customSiteGroup: document.querySelector('[data-custom-site]'),
  customSite: document.getElementById('customSite'),
  fileType: document.getElementById('fileType'),
  engine: document.getElementById('searchEngine'),
  launch: document.getElementById('launchSearch'),
  copy: document.getElementById('copyQuery'),
  queryPreview: document.getElementById('queryPreview'),
  queryHints: document.getElementById('queryHints'),
  toggleSettings: document.getElementById('toggleSettings'),
  settingsPanel: document.getElementById('settingsPanel'),
  apiKey: document.getElementById('apiKey'),
  apiBase: document.getElementById('apiBase'),
  model: document.getElementById('model'),
  temperature: document.getElementById('temperature'),
  saveSettings: document.getElementById('saveSettings'),
  resetSettings: document.getElementById('resetSettings'),
  assistantPrompt: document.getElementById('assistantPrompt'),
  runAssistant: document.getElementById('runAssistant'),
  assistantStatus: document.getElementById('assistantStatus'),
  suggestionList: document.getElementById('suggestionList'),
  clearPrompt: document.getElementById('clearPrompt'),
};

const state = {
  settings: { ...defaultSettings },
  query: '',
};

function splitTerms(raw) {
  if (!raw) return [];
  return raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function quoteIfNeeded(term) {
  if (!term) return '';
  if (/^".*"$/.test(term)) {
    return term;
  }
  if (/\s/.test(term) || /[()]/.test(term)) {
    return `"${term.replace(/"/g, '\\"')}"`;
  }
  return term;
}

function buildSiteExpression(preset, custom) {
  switch (preset) {
    case 'linkedin_people':
      return '(site:linkedin.com/in OR site:linkedin.com/pub)';
    case 'linkedin_company':
      return 'site:linkedin.com/company';
    case 'github':
      return 'site:github.com';
    case 'stackoverflow':
      return 'site:stackoverflow.com';
    case 'behance':
      return 'site:behance.net';
    case 'custom':
      return custom ? `site:${custom}` : '';
    default:
      return '';
  }
}

function buildQuery() {
  const mustTerms = splitTerms(dom.must.value);
  const phraseTerms = splitTerms(dom.phrases.value);
  const anyTerms = splitTerms(dom.any.value);
  const excludeTerms = splitTerms(dom.exclude.value);
  const siteExpression = buildSiteExpression(dom.sitePreset.value, dom.customSite.value.trim());
  const fileType = dom.fileType.value.trim();

  const segments = [];
  mustTerms.forEach((term) => {
    const token = quoteIfNeeded(term);
    if (token) segments.push(token);
  });
  phraseTerms.forEach((term) => {
    if (term) {
      segments.push(`"${term.replace(/"/g, '\\"')}"`);
    }
  });
  if (anyTerms.length > 0) {
    const anySegment = anyTerms.map((term) => quoteIfNeeded(term)).filter(Boolean).join(' OR ');
    if (anySegment) {
      segments.push(`(${anySegment})`);
    }
  }
  excludeTerms.forEach((term) => {
    const token = quoteIfNeeded(term);
    if (token) {
      segments.push(`-${token}`);
    }
  });
  if (siteExpression) {
    segments.push(siteExpression);
  }
  if (fileType) {
    segments.push(`filetype:${fileType}`);
  }

  const query = segments.join(' ').trim();
  state.query = query;
  dom.queryPreview.textContent = query || '';
  dom.queryHints.textContent = query
    ? 'Review the compiled query below. Copy or launch when ready.'
    : 'Start entering inputs to generate a query.';
}

function resolveSearchUrl(engine, query) {
  const encoded = encodeURIComponent(query);
  switch (engine) {
    case 'bing':
      return `https://www.bing.com/search?q=${encoded}`;
    case 'duckduckgo':
      return `https://duckduckgo.com/?q=${encoded}`;
    case 'google':
    default:
      return `https://www.google.com/search?q=${encoded}`;
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(storageKeys.settings);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.settings = { ...defaultSettings, ...parsed };
  } catch (error) {
    console.warn('Unable to parse settings', error);
    state.settings = { ...defaultSettings };
  }
}

function persistSettings() {
  localStorage.setItem(storageKeys.settings, JSON.stringify(state.settings));
}

function populateSettingsForm() {
  dom.apiKey.value = state.settings.apiKey;
  dom.apiBase.value = state.settings.apiBase;
  dom.model.value = state.settings.model;
  dom.temperature.value = state.settings.temperature;
}

function toggleCustomSite() {
  const shouldShow = dom.sitePreset.value === 'custom';
  dom.customSiteGroup.hidden = !shouldShow;
  if (!shouldShow) {
    dom.customSite.value = '';
  }
}

async function runAssistant(prompt) {
  const { apiKey, apiBase, model, temperature } = state.settings;
  if (!apiKey) {
    throw new Error('Add your API key in settings to use the assistant.');
  }
  const url = `${(apiBase || '').replace(/\/$/, '')}/chat/completions`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          {
            role: 'system',
            content:
              'You design boolean search strategies for sourcing talent and intelligence gathering. Respond with JSON only.',
          },
          {
            role: 'user',
            content: `${prompt}\n\nReturn a JSON object with an "options" array (max 3). Each option must include: "title" (string), "mustInclude" (array of strings), "exactPhrases" (array of strings), "anyOf" (array of strings), "exclude" (array of strings), "site" (string or null), "fileType" (string or null), and "notes" (string). Ensure JSON is valid and contains no commentary.`,
          },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
    }
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('The assistant returned an empty response.');
    }
    return parseOptions(text.trim());
  } finally {
    clearTimeout(timeout);
  }
}

function parseOptions(raw) {
  const jsonBlockMatch = raw.match(/```json\s*([\s\S]+?)\s*```/i);
  const jsonText = jsonBlockMatch ? jsonBlockMatch[1] : raw;
  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed?.options)) {
      return parsed.options;
    }
    if (Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error('Response JSON missing "options" array.');
  } catch (error) {
    console.warn('Failed to parse assistant output', error, jsonText);
    throw new Error('Unable to parse assistant output. Ask it to respond with valid JSON.');
  }
}

function renderSuggestions(options) {
  dom.suggestionList.innerHTML = '';
  if (!options || options.length === 0) {
    dom.suggestionList.innerHTML = '<p class="hint">No suggestions yet. Provide more detail and try again.</p>';
    return;
  }
  options.forEach((option, index) => {
    const card = document.createElement('article');
    card.className = 'suggestion-card';

    const title = document.createElement('h3');
    title.textContent = option.title || `Option ${index + 1}`;
    card.appendChild(title);

    const list = document.createElement('ul');
    const sections = [
      ['Must include', option.mustInclude],
      ['Exact phrases', option.exactPhrases],
      ['Any of', option.anyOf],
      ['Exclude', option.exclude],
    ];
    sections.forEach(([label, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        const item = document.createElement('li');
        item.innerHTML = `<strong>${label}:</strong> ${values.join(', ')}`;
        list.appendChild(item);
      }
    });
    if (option.site) {
      const item = document.createElement('li');
      item.innerHTML = `<strong>Site:</strong> ${option.site}`;
      list.appendChild(item);
    }
    if (option.fileType) {
      const item = document.createElement('li');
      item.innerHTML = `<strong>File type:</strong> ${option.fileType}`;
      list.appendChild(item);
    }
    card.appendChild(list);

    if (option.notes) {
      const notes = document.createElement('p');
      notes.className = 'hint';
      notes.textContent = option.notes;
      card.appendChild(notes);
    }

    const footer = document.createElement('footer');
    const apply = document.createElement('button');
    apply.type = 'button';
    apply.className = 'primary-button apply-button';
    apply.textContent = 'Apply';
    apply.addEventListener('click', () => applySuggestion(option));
    footer.appendChild(apply);
    card.appendChild(footer);

    dom.suggestionList.appendChild(card);
  });
}

function applySuggestion(option) {
  if (!option || typeof option !== 'object') return;
  dom.must.value = (option.mustInclude || []).join('\n');
  dom.phrases.value = (option.exactPhrases || []).join('\n');
  dom.any.value = (option.anyOf || []).join('\n');
  dom.exclude.value = (option.exclude || []).join('\n');

  if (option.site) {
    const normalizedSite = option.site.toLowerCase();
    const presetEntries = {
      'site:linkedin.com/in': 'linkedin_people',
      'site:linkedin.com/company': 'linkedin_company',
      'site:github.com': 'github',
      'site:stackoverflow.com': 'stackoverflow',
      'site:behance.net': 'behance',
    };
    const presetMatch = Object.entries(presetEntries).find(([key]) => normalizedSite.includes(key));
    if (presetMatch) {
      dom.sitePreset.value = presetMatch[1];
      dom.customSite.value = '';
    } else {
      dom.sitePreset.value = 'custom';
      dom.customSite.value = normalizedSite.replace(/^site:/, '');
    }
  } else {
    dom.sitePreset.value = 'none';
    dom.customSite.value = '';
  }
  toggleCustomSite();

  if (option.fileType) {
    dom.fileType.value = option.fileType.replace(/^filetype:/i, '').trim();
  } else {
    dom.fileType.value = '';
  }

  buildQuery();
  dom.queryPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function attachListeners() {
  [dom.must, dom.phrases, dom.any, dom.exclude, dom.customSite, dom.fileType].forEach((input) => {
    input.addEventListener('input', buildQuery);
  });
  dom.sitePreset.addEventListener('change', () => {
    toggleCustomSite();
    buildQuery();
  });
  dom.launch.addEventListener('click', () => {
    if (!state.query) {
      dom.assistantStatus.textContent = 'Nothing to launch yet. Add terms first.';
      return;
    }
    const url = resolveSearchUrl(dom.engine.value, state.query);
    window.open(url, '_blank', 'noopener');
  });
  dom.copy.addEventListener('click', async () => {
    if (!state.query) {
      dom.assistantStatus.textContent = 'Nothing to copy yet.';
      return;
    }
    try {
      await navigator.clipboard.writeText(state.query);
      dom.assistantStatus.textContent = 'Query copied to clipboard.';
    } catch (error) {
      dom.assistantStatus.textContent = 'Clipboard unavailable. Select and copy manually.';
    }
  });
  dom.toggleSettings.addEventListener('click', () => {
    const expanded = dom.toggleSettings.getAttribute('aria-expanded') === 'true';
    dom.toggleSettings.setAttribute('aria-expanded', String(!expanded));
    dom.settingsPanel.hidden = expanded;
  });
  dom.saveSettings.addEventListener('click', () => {
    state.settings = {
      apiKey: dom.apiKey.value.trim(),
      apiBase: dom.apiBase.value.trim() || defaultSettings.apiBase,
      model: dom.model.value.trim() || defaultSettings.model,
      temperature: Number(dom.temperature.value) || defaultSettings.temperature,
    };
    persistSettings();
    dom.assistantStatus.textContent = 'Settings saved locally.';
  });
  dom.resetSettings.addEventListener('click', () => {
    state.settings = { ...defaultSettings };
    persistSettings();
    populateSettingsForm();
    dom.assistantStatus.textContent = 'Settings reset.';
  });
  dom.runAssistant.addEventListener('click', async () => {
    const prompt = dom.assistantPrompt.value.trim();
    if (!prompt) {
      dom.assistantStatus.textContent = 'Describe what you are looking for first.';
      return;
    }
    dom.assistantStatus.textContent = 'Contacting assistant...';
    dom.runAssistant.disabled = true;
    dom.runAssistant.textContent = 'Generating...';
    try {
      const options = await runAssistant(prompt);
      renderSuggestions(options);
      dom.assistantStatus.textContent = 'Suggestions ready. Apply one to populate the builder.';
    } catch (error) {
      dom.assistantStatus.textContent = error.message;
      dom.suggestionList.innerHTML = '';
    } finally {
      dom.runAssistant.disabled = false;
      dom.runAssistant.textContent = 'Generate suggestions';
    }
  });
  dom.clearPrompt.addEventListener('click', () => {
    dom.assistantPrompt.value = '';
    dom.assistantStatus.textContent = '';
    dom.suggestionList.innerHTML = '';
  });
}

(function init() {
  loadSettings();
  populateSettingsForm();
  toggleCustomSite();
  buildQuery();
  attachListeners();
})();
