const starCanvas = document.getElementById('starfield');
const ctx = starCanvas.getContext('2d');
const stars = [];
const STAR_COUNT = 180;
let animationFrame;
let starFillStyle = 'rgba(0, 200, 255, 0.8)';

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  starCanvas.width = starCanvas.clientWidth * ratio;
  starCanvas.height = starCanvas.clientHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function createStars() {
  stars.length = 0;
  const width = starCanvas.clientWidth;
  const height = starCanvas.clientHeight;
  for (let i = 0; i < STAR_COUNT; i += 1) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      depth: Math.random() * 1.2 + 0.2,
      velocity: Math.random() * 0.6 + 0.2,
    });
  }
}

function drawStarfield() {
  const width = starCanvas.clientWidth;
  const height = starCanvas.clientHeight;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = starFillStyle;

  stars.forEach((star) => {
    const size = (1.4 - star.depth) * 2.2;
    const x = star.x + Math.sin(performance.now() / 900 + star.depth) * 4;
    const y = star.y + star.velocity * 1.8;

    ctx.globalAlpha = Math.min(1, 0.4 + (1 - star.depth));
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    star.y = y;
    if (star.y > height + 4) {
      star.y = -4;
      star.x = Math.random() * width;
      star.depth = Math.random() * 1.2 + 0.2;
      star.velocity = Math.random() * 0.6 + 0.2;
    }
  });

  ctx.globalAlpha = 1;
  animationFrame = requestAnimationFrame(drawStarfield);
}

function initStarfield() {
  resizeCanvas();
  createStars();
  cancelAnimationFrame(animationFrame);
  drawStarfield();
}

window.addEventListener('resize', () => {
  resizeCanvas();
  createStars();
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeHex(hex) {
  if (!hex) return null;
  let value = hex.trim();
  if (!value) return null;
  if (value.startsWith('#')) {
    value = value.slice(1);
  }
  if (value.length === 3) {
    value = value
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (value.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(value)) {
    return null;
  }
  return `#${value.toUpperCase()}`;
}

function rgbToHex({ r, g, b }) {
  const toHex = (component) => clamp(Math.round(component), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const value = parseInt(normalized.slice(1), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h, s, l };
}

function hslToRgb(h, s, l) {
  if (s === 0) {
    const value = clamp(Math.round(l * 255), 0, 255);
    return { r: value, g: value, b: value };
  }

  const hue2rgb = (p, q, t) => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: clamp(Math.round(hue2rgb(p, q, h + 1 / 3) * 255), 0, 255),
    g: clamp(Math.round(hue2rgb(p, q, h) * 255), 0, 255),
    b: clamp(Math.round(hue2rgb(p, q, h - 1 / 3) * 255), 0, 255),
  };
}

function adjustLightness(hex, amount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const { h, s, l } = rgbToHsl(rgb);
  const adjusted = clamp(l + amount, 0, 1);
  const converted = hslToRgb(h, s, adjusted);
  return normalizeHex(rgbToHex(converted)) || hex;
}

function withAlpha(hex, alpha) {
  const rgb = hexToRgb(hex);
  const normalizedAlpha = clamp(alpha, 0, 1);
  if (!rgb) {
    return `rgba(0, 0, 0, ${Number(normalizedAlpha.toFixed(3))})`;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Number(normalizedAlpha.toFixed(3))})`;
}

function toHexColor(value) {
  const normalized = normalizeHex(value);
  if (normalized) return normalized;
  if (!value) return null;
  const match = value
    .trim()
    .match(/^rgba?\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (!match) return null;
  const [r, g, b] = match.slice(1, 4).map((component) => Number(component));
  return normalizeHex(rgbToHex({ r, g, b }));
}

function updateStarfieldColor(accent) {
  const hexAccent = toHexColor(accent);
  const rgb = hexToRgb(hexAccent);
  if (rgb) {
    starFillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
  }
}

function createThemeFromAccent(accentHex) {
  const accent = normalizeHex(accentHex) || '#00F5D4';
  const secondary = adjustLightness(accent, -0.18);
  const highlight = adjustLightness(accent, 0.18);
  return {
    '--bg': '#050608',
    '--shell-bg': 'rgba(2, 6, 12, 0.78)',
    '--shell-border': withAlpha(accent, 0.2),
    '--shell-shadow': withAlpha(secondary, 0.28),
    '--accent': accent,
    '--accent-secondary': secondary,
    '--accent-soft': withAlpha(highlight, 0.18),
    '--logo-inner-glow': withAlpha(accent, 0.24),
    '--logo-outer-glow': withAlpha(secondary, 0.32),
    '--logo-bg-start': withAlpha(accent, 0.16),
    '--logo-bg-end': withAlpha(secondary, 0.12),
    '--sound-border': withAlpha(accent, 0.45),
    '--sound-shadow': withAlpha(accent, 0.28),
    '--sound-active-border': withAlpha(secondary, 0.45),
    '--sound-active-shadow': withAlpha(secondary, 0.3),
    '--panel-bg': 'rgba(3, 12, 18, 0.8)',
    '--hero-overlay': withAlpha(highlight, 0.08),
    '--text': '#e6f7ff',
    '--muted': 'rgba(230, 247, 255, 0.6)',
    '--grid-line': withAlpha(accent, 0.18),
    '--slot-bg': 'rgba(8, 18, 28, 0.6)',
    '--slot-border': withAlpha(secondary, 0.24),
    '--footer-muted': 'rgba(230, 247, 255, 0.52)',
    '--scanline': withAlpha(accent, 0.1),
    '--noise-opacity': '0.16',
  };
}

const themePresets = {
  signal: {
    label: 'Signal Core',
    values: {
      '--bg': '#050608',
      '--shell-bg': 'rgba(2, 6, 12, 0.78)',
      '--shell-border': 'rgba(0, 245, 212, 0.2)',
      '--shell-shadow': 'rgba(0, 168, 255, 0.25)',
      '--accent': '#00F5D4',
      '--accent-secondary': '#00A8FF',
      '--accent-soft': 'rgba(0, 168, 255, 0.15)',
      '--logo-inner-glow': 'rgba(0, 245, 212, 0.2)',
      '--logo-outer-glow': 'rgba(0, 168, 255, 0.4)',
      '--logo-bg-start': 'rgba(0, 245, 212, 0.1)',
      '--logo-bg-end': 'rgba(0, 168, 255, 0.08)',
      '--sound-border': 'rgba(0, 245, 212, 0.4)',
      '--sound-shadow': 'rgba(0, 245, 212, 0.25)',
      '--sound-active-border': 'rgba(0, 168, 255, 0.4)',
      '--sound-active-shadow': 'rgba(0, 168, 255, 0.35)',
      '--panel-bg': 'rgba(3, 12, 18, 0.8)',
      '--hero-overlay': 'rgba(0, 168, 255, 0.04)',
      '--text': '#E6F7FF',
      '--muted': 'rgba(230, 247, 255, 0.6)',
      '--grid-line': 'rgba(0, 245, 212, 0.14)',
      '--slot-bg': 'rgba(8, 18, 28, 0.6)',
      '--slot-border': 'rgba(0, 168, 255, 0.25)',
      '--footer-muted': 'rgba(230, 247, 255, 0.45)',
      '--scanline': 'rgba(0, 245, 212, 0.08)',
      '--noise-opacity': '0.15',
    },
  },
  aurora: {
    label: 'Aurora Drive',
    values: {
      '--bg': '#03060D',
      '--shell-bg': 'rgba(6, 10, 24, 0.82)',
      '--shell-border': 'rgba(112, 173, 255, 0.24)',
      '--shell-shadow': 'rgba(112, 214, 255, 0.28)',
      '--accent': '#70D6FF',
      '--accent-secondary': '#C77DFF',
      '--accent-soft': 'rgba(112, 173, 255, 0.18)',
      '--logo-inner-glow': 'rgba(199, 125, 255, 0.24)',
      '--logo-outer-glow': 'rgba(112, 214, 255, 0.32)',
      '--logo-bg-start': 'rgba(199, 125, 255, 0.15)',
      '--logo-bg-end': 'rgba(112, 214, 255, 0.1)',
      '--sound-border': 'rgba(112, 214, 255, 0.45)',
      '--sound-shadow': 'rgba(112, 214, 255, 0.28)',
      '--sound-active-border': 'rgba(199, 125, 255, 0.42)',
      '--sound-active-shadow': 'rgba(199, 125, 255, 0.35)',
      '--panel-bg': 'rgba(10, 16, 34, 0.82)',
      '--hero-overlay': 'rgba(112, 214, 255, 0.08)',
      '--text': '#F3F5FF',
      '--muted': 'rgba(243, 245, 255, 0.6)',
      '--grid-line': 'rgba(112, 214, 255, 0.18)',
      '--slot-bg': 'rgba(12, 20, 38, 0.72)',
      '--slot-border': 'rgba(199, 125, 255, 0.22)',
      '--footer-muted': 'rgba(243, 245, 255, 0.5)',
      '--scanline': 'rgba(112, 214, 255, 0.08)',
      '--noise-opacity': '0.18',
    },
  },
  ember: {
    label: 'Ember Forge',
    values: {
      '--bg': '#0D0403',
      '--shell-bg': 'rgba(26, 10, 6, 0.85)',
      '--shell-border': 'rgba(255, 126, 95, 0.24)',
      '--shell-shadow': 'rgba(255, 120, 79, 0.3)',
      '--accent': '#FF784F',
      '--accent-secondary': '#FFBE0B',
      '--accent-soft': 'rgba(255, 120, 79, 0.16)',
      '--logo-inner-glow': 'rgba(255, 120, 79, 0.24)',
      '--logo-outer-glow': 'rgba(255, 190, 11, 0.28)',
      '--logo-bg-start': 'rgba(255, 120, 79, 0.15)',
      '--logo-bg-end': 'rgba(255, 190, 11, 0.1)',
      '--sound-border': 'rgba(255, 120, 79, 0.45)',
      '--sound-shadow': 'rgba(255, 120, 79, 0.3)',
      '--sound-active-border': 'rgba(255, 190, 11, 0.45)',
      '--sound-active-shadow': 'rgba(255, 190, 11, 0.32)',
      '--panel-bg': 'rgba(32, 12, 6, 0.85)',
      '--hero-overlay': 'rgba(255, 190, 11, 0.08)',
      '--text': '#FFEAE1',
      '--muted': 'rgba(255, 217, 203, 0.68)',
      '--grid-line': 'rgba(255, 120, 79, 0.18)',
      '--slot-bg': 'rgba(32, 12, 6, 0.72)',
      '--slot-border': 'rgba(255, 190, 11, 0.22)',
      '--footer-muted': 'rgba(255, 217, 203, 0.52)',
      '--scanline': 'rgba(255, 120, 79, 0.08)',
      '--noise-opacity': '0.2',
    },
  },
  terminal: {
    label: 'Terminal Wave',
    values: {
      '--bg': '#020502',
      '--shell-bg': 'rgba(4, 12, 4, 0.85)',
      '--shell-border': 'rgba(94, 252, 141, 0.22)',
      '--shell-shadow': 'rgba(29, 185, 84, 0.28)',
      '--accent': '#5EFC8D',
      '--accent-secondary': '#1DB954',
      '--accent-soft': 'rgba(94, 252, 141, 0.16)',
      '--logo-inner-glow': 'rgba(94, 252, 141, 0.24)',
      '--logo-outer-glow': 'rgba(29, 185, 84, 0.3)',
      '--logo-bg-start': 'rgba(94, 252, 141, 0.12)',
      '--logo-bg-end': 'rgba(29, 185, 84, 0.08)',
      '--sound-border': 'rgba(94, 252, 141, 0.4)',
      '--sound-shadow': 'rgba(94, 252, 141, 0.28)',
      '--sound-active-border': 'rgba(29, 185, 84, 0.45)',
      '--sound-active-shadow': 'rgba(29, 185, 84, 0.32)',
      '--panel-bg': 'rgba(4, 16, 6, 0.82)',
      '--hero-overlay': 'rgba(94, 252, 141, 0.08)',
      '--text': '#DFFFE9',
      '--muted': 'rgba(223, 255, 233, 0.65)',
      '--grid-line': 'rgba(94, 252, 141, 0.18)',
      '--slot-bg': 'rgba(6, 18, 8, 0.7)',
      '--slot-border': 'rgba(29, 185, 84, 0.22)',
      '--footer-muted': 'rgba(223, 255, 233, 0.5)',
      '--scanline': 'rgba(94, 252, 141, 0.08)',
      '--noise-opacity': '0.18',
    },
  },
};

const THEME_STORAGE_KEY = 'dashboardThemeSelection';
const root = document.documentElement;
const themeButtons = Array.from(document.querySelectorAll('.theme-chip'));
const customAccentInput = document.getElementById('customAccent');
const customApplyButton = document.getElementById('applyCustomTheme');
const themeDialog = document.getElementById('themeDialog');
const themeOpenButton = document.getElementById('themePanelToggle');

function saveThemeSelection(data) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Ignore storage issues
  }
}

function readStoredTheme() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function applyTheme(themeValues, { activeId = null, isCustom = false, persist = null, skipSave = false } = {}) {
  if (!themeValues) return;
  Object.entries(themeValues).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  const accentValue = themeValues['--accent'] || getComputedStyle(root).getPropertyValue('--accent');
  if (accentValue) {
    updateStarfieldColor(accentValue);
    const normalizedAccent = toHexColor(accentValue);
    if (normalizedAccent && customAccentInput) {
      customAccentInput.value = normalizedAccent;
    }
  }

  themeButtons.forEach((button) => {
    const isActive = button.dataset.theme === activeId;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  if (customApplyButton) {
    customApplyButton.classList.toggle('is-active', isCustom);
    customApplyButton.setAttribute('aria-pressed', isCustom ? 'true' : 'false');
  }

  if (!skipSave && persist) {
    saveThemeSelection(persist);
  }
}

function initializeThemeControls() {
  if (!themeButtons.length && !customAccentInput) {
    const accent = getComputedStyle(root).getPropertyValue('--accent');
    if (accent) {
      updateStarfieldColor(accent);
    }
    return;
  }

  const stored = readStoredTheme();

  if (stored?.type === 'preset' && themePresets[stored.id]) {
    applyTheme(themePresets[stored.id].values, {
      activeId: stored.id,
      persist: null,
      skipSave: true,
    });
  } else if (stored?.type === 'custom' && stored.accent) {
    const customTheme = createThemeFromAccent(stored.accent);
    applyTheme(customTheme, {
      isCustom: true,
      persist: null,
      skipSave: true,
    });
    if (customAccentInput) {
      const normalizedAccent = toHexColor(stored.accent);
      if (normalizedAccent) {
        customAccentInput.value = normalizedAccent;
      }
    }
  } else {
    applyTheme(themePresets.signal.values, {
      activeId: 'signal',
      persist: { type: 'preset', id: 'signal' },
    });
  }

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.theme;
      const preset = themePresets[key];
      if (!preset) return;
      applyTheme(preset.values, {
        activeId: key,
        persist: { type: 'preset', id: key },
      });
    });
  });

  if (customApplyButton && customAccentInput) {
    customApplyButton.addEventListener('click', () => {
      const accent = customAccentInput.value;
      const theme = createThemeFromAccent(accent);
      applyTheme(theme, {
        isCustom: true,
        persist: { type: 'custom', accent: normalizeHex(accent) || accent },
      });
    });
  }
}

function initializeThemeDialog() {
  if (!themeDialog || !themeOpenButton) {
    return;
  }

  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let lastActiveElement = null;

  const getFocusableElements = () =>
    Array.from(themeDialog.querySelectorAll(focusableSelector)).filter(
      (element) => !element.hasAttribute('disabled') && element.getAttribute('tabindex') !== '-1'
    );

  const closeDialog = () => {
    themeDialog.classList.remove('is-open');
    themeDialog.setAttribute('hidden', '');
    themeOpenButton.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', handleKeydown);
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements();
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === first || !themeDialog.contains(document.activeElement)) {
        event.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const openDialog = () => {
    lastActiveElement = document.activeElement;
    themeDialog.classList.add('is-open');
    themeDialog.removeAttribute('hidden');
    themeOpenButton.setAttribute('aria-expanded', 'true');

    const focusable = getFocusableElements();
    const preferred = focusable.find((element) => element.classList.contains('is-active'));
    (preferred || focusable[0])?.focus();

    document.addEventListener('keydown', handleKeydown);
  };

  themeOpenButton.addEventListener('click', () => {
    if (themeDialog.hasAttribute('hidden')) {
      openDialog();
    } else {
      closeDialog();
    }
  });

  themeDialog.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.themeClose !== undefined) {
      closeDialog();
    }
  });
}

initializeThemeControls();
initializeThemeDialog();
initStarfield();

// Cracktro soundtrack rotation system
const TRACK_ADVANCE_INTERVAL = 20000;
const SOUNDTRACK_STORAGE_KEY = 'dashboardSoundtrackSelection';

let audioCtx;
let masterGain;
let trackCleanup = null;
let sharedNoiseBuffer = null;
let soundEnabled = false;
let autoAdvanceTimer = null;
let currentTrackIndex = 0;

const soundOnButton = document.getElementById('soundOnButton');
const soundOffButton = document.getElementById('soundOffButton');
const soundtrackIndicator = document.getElementById('soundtrackIndicator');
const soundtrackList = document.getElementById('soundtrackList');
const soundtrackDescription = document.getElementById('soundtrackDescription');

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function createNoiseBuffer(context) {
  const bufferSize = context.sampleRate * 2;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function getNoiseBuffer(context) {
  if (!sharedNoiseBuffer || sharedNoiseBuffer.sampleRate !== context.sampleRate) {
    sharedNoiseBuffer = createNoiseBuffer(context);
  }
  return sharedNoiseBuffer;
}

function safeDisconnect(node) {
  if (node && typeof node.disconnect === 'function') {
    try {
      node.disconnect();
    } catch (error) {
      // Ignore disconnection failures
    }
  }
}

function fadeOutGain(context, gainNode, duration = 0.12) {
  if (!gainNode || typeof gainNode.gain === 'undefined') return;
  const now = context.currentTime;
  try {
    const current = gainNode.gain.value;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(current, now);
    gainNode.gain.linearRampToValueAtTime(0.0001, now + duration);
  } catch (error) {
    // Ignore ramp errors
  }
}

function stopOscillator(context, oscillator, gainNode, extraNodes = []) {
  if (!oscillator) return;
  fadeOutGain(context, gainNode);
  const stopTime = context.currentTime + 0.12;
  try {
    oscillator.stop(stopTime);
  } catch (error) {
    try {
      oscillator.stop();
    } catch (err) {
      // Ignore multiple stop invocations
    }
  }
  safeDisconnect(oscillator);
  if (gainNode) {
    safeDisconnect(gainNode);
  }
  extraNodes.forEach(safeDisconnect);
}

function stopBufferSource(context, source, gainNode, extraNodes = []) {
  if (!source) return;
  fadeOutGain(context, gainNode, 0.08);
  const stopTime = context.currentTime + 0.05;
  try {
    source.stop(stopTime);
  } catch (error) {
    try {
      source.stop();
    } catch (err) {
      // Ignore
    }
  }
  safeDisconnect(source);
  if (gainNode) {
    safeDisconnect(gainNode);
  }
  extraNodes.forEach(safeDisconnect);
}

function createCleanupRegistry() {
  const cleanups = [];
  return {
    add(fn) {
      if (typeof fn === 'function') {
        cleanups.push(fn);
      }
    },
    addInterval(callback, delay) {
      const id = setInterval(callback, delay);
      cleanups.push(() => clearInterval(id));
      return id;
    },
    addTimeout(callback, delay) {
      const id = setTimeout(callback, delay);
      cleanups.push(() => clearTimeout(id));
      return id;
    },
    dispose() {
      while (cleanups.length) {
        const cleanup = cleanups.pop();
        try {
          cleanup();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    },
  };
}

function createNeonRelay(context, master) {
  const cleanup = createCleanupRegistry();

  const lead = context.createOscillator();
  lead.type = 'square';
  const leadGain = context.createGain();
  leadGain.gain.value = 0.08;
  lead.connect(leadGain).connect(master);
  lead.start();
  cleanup.add(() => stopOscillator(context, lead, leadGain));

  const pattern = [392, 440, 523.25, 659.25, 523.25, 440, 392, 330];
  let step = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const freq = pattern[step % pattern.length];
    try {
      lead.frequency.cancelScheduledValues(now);
      lead.frequency.exponentialRampToValueAtTime(freq, now + 0.08);
      leadGain.gain.cancelScheduledValues(now);
      leadGain.gain.setValueAtTime(0.02, now);
      leadGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      leadGain.gain.linearRampToValueAtTime(0.04, now + 0.2);
    } catch (error) {
      // Ignore scheduling issues
    }
    step += 1;
  }, 200);

  const bass = context.createOscillator();
  bass.type = 'sawtooth';
  const bassFilter = context.createBiquadFilter();
  bassFilter.type = 'lowpass';
  bassFilter.frequency.value = 260;
  const bassGain = context.createGain();
  bassGain.gain.value = 0.05;
  bass.connect(bassFilter).connect(bassGain).connect(master);
  bass.start();
  cleanup.add(() => stopOscillator(context, bass, bassGain, [bassFilter]));

  const bassPattern = [110, 82.41, 110, 73.42];
  let bassStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const freq = bassPattern[bassStep % bassPattern.length];
    try {
      bass.frequency.setValueAtTime(freq, now);
      bassGain.gain.cancelScheduledValues(now);
      bassGain.gain.setValueAtTime(0.015, now);
      bassGain.gain.linearRampToValueAtTime(0.08, now + 0.08);
      bassGain.gain.linearRampToValueAtTime(0.015, now + 0.3);
      bassFilter.frequency.cancelScheduledValues(now);
      bassFilter.frequency.setValueAtTime(220, now);
      bassFilter.frequency.linearRampToValueAtTime(420, now + 0.18);
    } catch (error) {
      // Ignore scheduling issues
    }
    bassStep += 1;
  }, 320);

  const noiseSource = context.createBufferSource();
  noiseSource.buffer = getNoiseBuffer(context);
  noiseSource.loop = true;
  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 2600;
  const noiseGain = context.createGain();
  noiseGain.gain.value = 0.02;
  noiseSource.connect(noiseFilter).connect(noiseGain).connect(master);
  noiseSource.start();
  cleanup.add(() => stopBufferSource(context, noiseSource, noiseGain, [noiseFilter]));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      noiseGain.gain.cancelScheduledValues(now);
      noiseGain.gain.setValueAtTime(0.003, now);
      noiseGain.gain.linearRampToValueAtTime(0.035, now + 0.02);
      noiseGain.gain.linearRampToValueAtTime(0.003, now + 0.08);
    } catch (error) {
      // Ignore envelope errors
    }
  }, 120);

  return () => cleanup.dispose();
}

function createAuroraBloom(context, master) {
  const cleanup = createCleanupRegistry();

  const pad = context.createOscillator();
  pad.type = 'triangle';
  const padGain = context.createGain();
  padGain.gain.value = 0.12;
  pad.connect(padGain).connect(master);
  pad.start();
  cleanup.add(() => stopOscillator(context, pad, padGain));

  const padB = context.createOscillator();
  padB.type = 'sine';
  padB.detune.value = 700;
  const padBGain = context.createGain();
  padBGain.gain.value = 0.1;
  padB.connect(padBGain).connect(master);
  padB.start();
  cleanup.add(() => stopOscillator(context, padB, padBGain));

  const padLfo = context.createOscillator();
  padLfo.frequency.value = 0.12;
  const padLfoGain = context.createGain();
  padLfoGain.gain.value = 18;
  padLfo.connect(padLfoGain).connect(pad.detune);
  padLfo.start();
  cleanup.add(() => stopOscillator(context, padLfo, padLfoGain));

  const padBLfo = context.createOscillator();
  padBLfo.frequency.value = 0.16;
  const padBLfoGain = context.createGain();
  padBLfoGain.gain.value = 22;
  padBLfo.connect(padBLfoGain).connect(padB.detune);
  padBLfo.start();
  cleanup.add(() => stopOscillator(context, padBLfo, padBLfoGain));

  const chords = [
    { root: 220, top: 329.63 },
    { root: 207.65, top: 311.13 },
    { root: 246.94, top: 369.99 },
    { root: 233.08, top: 392 },
  ];
  let chordStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const chord = chords[chordStep % chords.length];
    try {
      pad.frequency.exponentialRampToValueAtTime(chord.root, now + 0.6);
      padB.frequency.exponentialRampToValueAtTime(chord.top, now + 0.6);
    } catch (error) {
      // Ignore chord updates
    }
    chordStep += 1;
  }, 1600);

  const sparkle = context.createOscillator();
  sparkle.type = 'sawtooth';
  const sparkleGain = context.createGain();
  sparkleGain.gain.value = 0;
  sparkle.connect(sparkleGain).connect(master);
  sparkle.start();
  cleanup.add(() => stopOscillator(context, sparkle, sparkleGain));

  const sparklePattern = [659.25, 554.37, 739.99, 587.33, 698.46, 880];
  let sparkleStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const freq = sparklePattern[sparkleStep % sparklePattern.length];
    try {
      sparkle.frequency.setValueAtTime(freq, now);
      sparkleGain.gain.cancelScheduledValues(now);
      sparkleGain.gain.setValueAtTime(0.0001, now);
      sparkleGain.gain.linearRampToValueAtTime(0.08, now + 0.03);
      sparkleGain.gain.linearRampToValueAtTime(0.0001, now + 0.32);
    } catch (error) {
      // Ignore sparkle scheduling
    }
    sparkleStep += 1;
  }, 360);

  const shimmerNoise = context.createBufferSource();
  shimmerNoise.buffer = getNoiseBuffer(context);
  shimmerNoise.loop = true;
  const shimmerFilter = context.createBiquadFilter();
  shimmerFilter.type = 'bandpass';
  shimmerFilter.frequency.value = 1800;
  shimmerFilter.Q.value = 4.2;
  const shimmerGain = context.createGain();
  shimmerGain.gain.value = 0.012;
  shimmerNoise.connect(shimmerFilter).connect(shimmerGain).connect(master);
  shimmerNoise.start();
  cleanup.add(() => stopBufferSource(context, shimmerNoise, shimmerGain, [shimmerFilter]));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      shimmerGain.gain.cancelScheduledValues(now);
      shimmerGain.gain.setValueAtTime(0.002, now);
      shimmerGain.gain.linearRampToValueAtTime(0.018, now + 0.12);
      shimmerGain.gain.linearRampToValueAtTime(0.002, now + 0.5);
    } catch (error) {
      // Ignore shimmer envelope errors
    }
  }, 900);

  return () => cleanup.dispose();
}

function createCircuitDreams(context, master) {
  const cleanup = createCleanupRegistry();

  const carrier = context.createOscillator();
  carrier.type = 'sawtooth';
  const carrierGain = context.createGain();
  carrierGain.gain.value = 0.07;
  carrier.connect(carrierGain).connect(master);
  carrier.start();
  cleanup.add(() => stopOscillator(context, carrier, carrierGain));

  const mod = context.createOscillator();
  mod.type = 'triangle';
  const modGain = context.createGain();
  modGain.gain.value = 80;
  mod.connect(modGain).connect(carrier.frequency);
  mod.start();
  cleanup.add(() => stopOscillator(context, mod, modGain));

  const basePattern = [196, 220, 246.94, 207.65, 233.08, 277.18];
  let baseStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const freq = basePattern[baseStep % basePattern.length];
    try {
      carrier.frequency.exponentialRampToValueAtTime(freq, now + 0.2);
      mod.frequency.setValueAtTime(freq * 1.5, now);
      modGain.gain.cancelScheduledValues(now);
      modGain.gain.setValueAtTime(60, now);
      modGain.gain.linearRampToValueAtTime(120, now + 0.4);
    } catch (error) {
      // Ignore FM scheduling
    }
    baseStep += 1;
  }, 420);

  const glitch = context.createOscillator();
  glitch.type = 'square';
  const glitchGain = context.createGain();
  glitchGain.gain.value = 0;
  glitch.connect(glitchGain).connect(master);
  glitch.start();
  cleanup.add(() => stopOscillator(context, glitch, glitchGain));

  let glitchStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const freq = 880 + (glitchStep % 5) * 60;
    try {
      glitch.frequency.setValueAtTime(freq, now);
      glitchGain.gain.cancelScheduledValues(now);
      glitchGain.gain.setValueAtTime(0.0001, now);
      glitchGain.gain.linearRampToValueAtTime(0.04, now + 0.015);
      glitchGain.gain.linearRampToValueAtTime(0.0001, now + 0.12);
    } catch (error) {
      // Ignore glitch envelope
    }
    glitchStep += 1;
  }, 160);

  const noiseSource = context.createBufferSource();
  noiseSource.buffer = getNoiseBuffer(context);
  noiseSource.loop = true;
  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 1400;
  noiseFilter.Q.value = 6;
  const noiseGain = context.createGain();
  noiseGain.gain.value = 0.018;
  noiseSource.connect(noiseFilter).connect(noiseGain).connect(master);
  noiseSource.start();
  cleanup.add(() => stopBufferSource(context, noiseSource, noiseGain, [noiseFilter]));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      noiseFilter.frequency.cancelScheduledValues(now);
      noiseFilter.frequency.setValueAtTime(1200, now);
      noiseFilter.frequency.linearRampToValueAtTime(2200, now + 0.24);
      noiseGain.gain.cancelScheduledValues(now);
      noiseGain.gain.setValueAtTime(0.003, now);
      noiseGain.gain.linearRampToValueAtTime(0.022, now + 0.06);
      noiseGain.gain.linearRampToValueAtTime(0.003, now + 0.22);
    } catch (error) {
      // Ignore noise scheduling errors
    }
  }, 280);

  const ping = context.createOscillator();
  ping.type = 'sine';
  const pingGain = context.createGain();
  pingGain.gain.value = 0;
  ping.connect(pingGain).connect(master);
  ping.start();
  cleanup.add(() => stopOscillator(context, ping, pingGain));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      ping.frequency.setValueAtTime(523.25, now);
      pingGain.gain.cancelScheduledValues(now);
      pingGain.gain.setValueAtTime(0.0001, now);
      pingGain.gain.linearRampToValueAtTime(0.06, now + 0.01);
      pingGain.gain.linearRampToValueAtTime(0.0001, now + 0.18);
    } catch (error) {
      // Ignore ping scheduling
    }
  }, 640);

  return () => cleanup.dispose();
}

function createIonDrift(context, master) {
  const cleanup = createCleanupRegistry();

  const pad = context.createOscillator();
  pad.type = 'sawtooth';
  const padFilter = context.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 320;
  padFilter.Q.value = 1.6;
  const padGain = context.createGain();
  padGain.gain.value = 0.09;
  pad.connect(padFilter);
  padFilter.connect(padGain);
  padGain.connect(master);
  pad.start();
  cleanup.add(() => stopOscillator(context, pad, padGain, [padFilter]));

  const driftPattern = [174.61, 196, 220, 246.94, 207.65];
  let driftStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const freq = driftPattern[driftStep % driftPattern.length];
    try {
      pad.frequency.exponentialRampToValueAtTime(freq, now + 0.8);
      padFilter.frequency.cancelScheduledValues(now);
      padFilter.frequency.setValueAtTime(280, now);
      padFilter.frequency.linearRampToValueAtTime(520, now + 0.6);
    } catch (error) {
      // Ignore pad scheduling
    }
    driftStep += 1;
  }, 1200);

  const sub = context.createOscillator();
  sub.type = 'sine';
  const subGain = context.createGain();
  subGain.gain.value = 0.05;
  sub.connect(subGain).connect(master);
  sub.start();
  cleanup.add(() => stopOscillator(context, sub, subGain));

  const subPattern = [55, 65.41, 82.41, 73.42];
  let subStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      sub.frequency.setValueAtTime(subPattern[subStep % subPattern.length], now);
      subGain.gain.cancelScheduledValues(now);
      subGain.gain.setValueAtTime(0.005, now);
      subGain.gain.linearRampToValueAtTime(0.06, now + 0.12);
      subGain.gain.linearRampToValueAtTime(0.01, now + 0.48);
    } catch (error) {
      // Ignore sub scheduling
    }
    subStep += 1;
  }, 640);

  const shimmer = context.createOscillator();
  shimmer.type = 'triangle';
  const shimmerGain = context.createGain();
  shimmerGain.gain.value = 0;
  shimmer.connect(shimmerGain).connect(master);
  shimmer.start();
  cleanup.add(() => stopOscillator(context, shimmer, shimmerGain));

  const shimmerPattern = [988, 880, 1046.5, 932, 1174.7];
  let shimmerStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const freq = shimmerPattern[shimmerStep % shimmerPattern.length];
    try {
      shimmer.frequency.setValueAtTime(freq, now);
      shimmerGain.gain.cancelScheduledValues(now);
      shimmerGain.gain.setValueAtTime(0.0001, now);
      shimmerGain.gain.linearRampToValueAtTime(0.05, now + 0.04);
      shimmerGain.gain.linearRampToValueAtTime(0.0001, now + 0.18);
    } catch (error) {
      // Ignore shimmer scheduling
    }
    shimmerStep += 1;
  }, 320);

  const wind = context.createBufferSource();
  wind.buffer = getNoiseBuffer(context);
  wind.loop = true;
  const windFilter = context.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 600;
  windFilter.Q.value = 1.2;
  const windGain = context.createGain();
  windGain.gain.value = 0.015;
  wind.connect(windFilter).connect(windGain).connect(master);
  wind.start();
  cleanup.add(() => stopBufferSource(context, wind, windGain, [windFilter]));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      windFilter.frequency.cancelScheduledValues(now);
      windFilter.frequency.setValueAtTime(520, now);
      windFilter.frequency.linearRampToValueAtTime(820, now + 0.5);
      windGain.gain.cancelScheduledValues(now);
      windGain.gain.setValueAtTime(0.004, now);
      windGain.gain.linearRampToValueAtTime(0.02, now + 0.3);
      windGain.gain.linearRampToValueAtTime(0.004, now + 0.9);
    } catch (error) {
      // Ignore wind scheduling
    }
  }, 1200);

  return () => cleanup.dispose();
}

function createNightRunner(context, master) {
  const cleanup = createCleanupRegistry();

  const lead = context.createOscillator();
  lead.type = 'square';
  const leadGain = context.createGain();
  leadGain.gain.value = 0;
  lead.connect(leadGain).connect(master);
  lead.start();
  cleanup.add(() => stopOscillator(context, lead, leadGain));

  const leadPattern = [659.25, 698.46, 880, 739.99, 659.25, 587.33, 659.25, 523.25];
  let leadStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const freq = leadPattern[leadStep % leadPattern.length];
    try {
      lead.frequency.setValueAtTime(freq, now);
      leadGain.gain.cancelScheduledValues(now);
      leadGain.gain.setValueAtTime(0.0001, now);
      leadGain.gain.linearRampToValueAtTime(0.07, now + 0.02);
      leadGain.gain.linearRampToValueAtTime(0.0001, now + 0.18);
    } catch (error) {
      // Ignore lead scheduling
    }
    leadStep += 1;
  }, 150);

  const bass = context.createOscillator();
  bass.type = 'sawtooth';
  const bassGain = context.createGain();
  bassGain.gain.value = 0.05;
  bass.connect(bassGain).connect(master);
  bass.start();
  cleanup.add(() => stopOscillator(context, bass, bassGain));

  const bassPattern = [110, 110, 164.81, 123.47];
  let bassStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const freq = bassPattern[bassStep % bassPattern.length];
    try {
      bass.frequency.setValueAtTime(freq, now);
      bassGain.gain.cancelScheduledValues(now);
      bassGain.gain.setValueAtTime(0.015, now);
      bassGain.gain.linearRampToValueAtTime(0.09, now + 0.05);
      bassGain.gain.linearRampToValueAtTime(0.02, now + 0.22);
    } catch (error) {
      // Ignore bass scheduling
    }
    bassStep += 1;
  }, 300);

  const kick = context.createOscillator();
  kick.type = 'sine';
  const kickGain = context.createGain();
  kickGain.gain.value = 0;
  kick.connect(kickGain).connect(master);
  kick.start();
  cleanup.add(() => stopOscillator(context, kick, kickGain));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      kick.frequency.setValueAtTime(140, now);
      kick.frequency.exponentialRampToValueAtTime(55, now + 0.12);
      kickGain.gain.cancelScheduledValues(now);
      kickGain.gain.setValueAtTime(0.0001, now);
      kickGain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      kickGain.gain.linearRampToValueAtTime(0.0001, now + 0.22);
    } catch (error) {
      // Ignore kick scheduling
    }
  }, 600);

  const hat = context.createBufferSource();
  hat.buffer = getNoiseBuffer(context);
  hat.loop = true;
  const hatFilter = context.createBiquadFilter();
  hatFilter.type = 'highpass';
  hatFilter.frequency.value = 3500;
  const hatGain = context.createGain();
  hatGain.gain.value = 0.015;
  hat.connect(hatFilter).connect(hatGain).connect(master);
  hat.start();
  cleanup.add(() => stopBufferSource(context, hat, hatGain, [hatFilter]));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      hatGain.gain.cancelScheduledValues(now);
      hatGain.gain.setValueAtTime(0.002, now);
      hatGain.gain.linearRampToValueAtTime(0.022, now + 0.015);
      hatGain.gain.linearRampToValueAtTime(0.002, now + 0.08);
    } catch (error) {
      // Ignore hat scheduling
    }
  }, 120);

  return () => cleanup.dispose();
}

function createGhostGrid(context, master) {
  const cleanup = createCleanupRegistry();

  const noise = context.createBufferSource();
  noise.buffer = getNoiseBuffer(context);
  noise.loop = true;
  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 900;
  noiseFilter.Q.value = 8;
  const noiseGain = context.createGain();
  noiseGain.gain.value = 0.018;
  noise.connect(noiseFilter).connect(noiseGain).connect(master);
  noise.start();
  cleanup.add(() => stopBufferSource(context, noise, noiseGain, [noiseFilter]));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      noiseFilter.frequency.cancelScheduledValues(now);
      noiseFilter.frequency.setValueAtTime(780, now);
      noiseFilter.frequency.linearRampToValueAtTime(1320, now + 0.4);
      noiseGain.gain.cancelScheduledValues(now);
      noiseGain.gain.setValueAtTime(0.004, now);
      noiseGain.gain.linearRampToValueAtTime(0.02, now + 0.18);
      noiseGain.gain.linearRampToValueAtTime(0.004, now + 0.5);
    } catch (error) {
      // Ignore noise modulation
    }
  }, 600);

  const bellA = context.createOscillator();
  bellA.type = 'sine';
  const bellAGain = context.createGain();
  bellAGain.gain.value = 0;
  bellA.connect(bellAGain).connect(master);
  bellA.start();
  cleanup.add(() => stopOscillator(context, bellA, bellAGain));

  const bellB = context.createOscillator();
  bellB.type = 'triangle';
  const bellBGain = context.createGain();
  bellBGain.gain.value = 0;
  bellB.connect(bellBGain).connect(master);
  bellB.start();
  cleanup.add(() => stopOscillator(context, bellB, bellBGain));

  const bellPairs = [
    [659.25, 987.77],
    [587.33, 880],
    [698.46, 1046.5],
    [554.37, 830.61],
  ];
  let bellStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const pair = bellPairs[bellStep % bellPairs.length];
    try {
      bellA.frequency.setValueAtTime(pair[0], now);
      bellB.frequency.setValueAtTime(pair[1], now);
      bellAGain.gain.cancelScheduledValues(now);
      bellAGain.gain.setValueAtTime(0.0001, now);
      bellAGain.gain.linearRampToValueAtTime(0.05, now + 0.04);
      bellAGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      bellBGain.gain.cancelScheduledValues(now);
      bellBGain.gain.setValueAtTime(0.0001, now);
      bellBGain.gain.linearRampToValueAtTime(0.04, now + 0.03);
      bellBGain.gain.linearRampToValueAtTime(0.0001, now + 0.32);
    } catch (error) {
      // Ignore bell scheduling
    }
    bellStep += 1;
  }, 520);

  const pulse = context.createOscillator();
  pulse.type = 'square';
  const pulseGain = context.createGain();
  pulseGain.gain.value = 0;
  pulse.connect(pulseGain).connect(master);
  pulse.start();
  cleanup.add(() => stopOscillator(context, pulse, pulseGain));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      pulse.frequency.setValueAtTime(220, now);
      pulseGain.gain.cancelScheduledValues(now);
      pulseGain.gain.setValueAtTime(0.0001, now);
      pulseGain.gain.linearRampToValueAtTime(0.03, now + 0.02);
      pulseGain.gain.linearRampToValueAtTime(0.0001, now + 0.18);
    } catch (error) {
      // Ignore pulse scheduling
    }
  }, 480);

  return () => cleanup.dispose();
}

function createSolarEcho(context, master) {
  const cleanup = createCleanupRegistry();

  const tone = context.createOscillator();
  tone.type = 'triangle';
  const toneGain = context.createGain();
  toneGain.gain.value = 0.08;
  const delay = context.createDelay(0.6);
  delay.delayTime.value = 0.42;
  const feedback = context.createGain();
  feedback.gain.value = 0.3;
  const delayOutput = context.createGain();
  delayOutput.gain.value = 0.7;

  tone.connect(toneGain);
  toneGain.connect(master);
  toneGain.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(delayOutput);
  delayOutput.connect(master);
  tone.start();
  cleanup.add(() => {
    stopOscillator(context, tone, toneGain);
    safeDisconnect(delayOutput);
    safeDisconnect(delay);
    safeDisconnect(feedback);
  });

  const tonePattern = [261.63, 311.13, 349.23, 392, 440];
  let toneStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const freq = tonePattern[toneStep % tonePattern.length];
    try {
      tone.frequency.exponentialRampToValueAtTime(freq, now + 0.22);
      toneGain.gain.cancelScheduledValues(now);
      toneGain.gain.setValueAtTime(0.02, now);
      toneGain.gain.linearRampToValueAtTime(0.09, now + 0.05);
      toneGain.gain.linearRampToValueAtTime(0.03, now + 0.32);
    } catch (error) {
      // Ignore tone scheduling
    }
    toneStep += 1;
  }, 360);

  const click = context.createBufferSource();
  click.buffer = getNoiseBuffer(context);
  click.loop = true;
  const clickFilter = context.createBiquadFilter();
  clickFilter.type = 'highpass';
  clickFilter.frequency.value = 1800;
  const clickGain = context.createGain();
  clickGain.gain.value = 0.01;
  click.connect(clickFilter).connect(clickGain).connect(master);
  click.start();
  cleanup.add(() => stopBufferSource(context, click, clickGain, [clickFilter]));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      clickGain.gain.cancelScheduledValues(now);
      clickGain.gain.setValueAtTime(0.001, now);
      clickGain.gain.linearRampToValueAtTime(0.016, now + 0.02);
      clickGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
    } catch (error) {
      // Ignore click scheduling
    }
  }, 200);

  const drone = context.createOscillator();
  drone.type = 'sine';
  const droneGain = context.createGain();
  droneGain.gain.value = 0.03;
  drone.connect(droneGain).connect(master);
  drone.frequency.value = 98;
  drone.start();
  cleanup.add(() => stopOscillator(context, drone, droneGain));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      droneGain.gain.cancelScheduledValues(now);
      droneGain.gain.setValueAtTime(0.01, now);
      droneGain.gain.linearRampToValueAtTime(0.05, now + 0.4);
      droneGain.gain.linearRampToValueAtTime(0.01, now + 1.1);
    } catch (error) {
      // Ignore drone modulation
    }
  }, 1600);

  return () => cleanup.dispose();
}

function createPrismWaltz(context, master) {
  const cleanup = createCleanupRegistry();

  const chord = context.createOscillator();
  chord.type = 'triangle';
  const chordGain = context.createGain();
  chordGain.gain.value = 0.06;
  chord.connect(chordGain).connect(master);
  chord.start();
  cleanup.add(() => stopOscillator(context, chord, chordGain));

  const chordPattern = [
    { freq: 261.63, detune: 0 },
    { freq: 293.66, detune: 120 },
    { freq: 329.63, detune: -80 },
    { freq: 392, detune: 40 },
  ];
  let chordStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const chordInfo = chordPattern[chordStep % chordPattern.length];
    try {
      chord.frequency.exponentialRampToValueAtTime(chordInfo.freq, now + 0.18);
      chord.detune.setValueAtTime(chordInfo.detune, now);
      chordGain.gain.cancelScheduledValues(now);
      chordGain.gain.setValueAtTime(0.03, now);
      chordGain.gain.linearRampToValueAtTime(0.08, now + 0.1);
      chordGain.gain.linearRampToValueAtTime(0.03, now + 0.32);
    } catch (error) {
      // Ignore chord scheduling
    }
    chordStep += 1;
  }, 540);

  const waltzLead = context.createOscillator();
  waltzLead.type = 'sine';
  const leadGain = context.createGain();
  leadGain.gain.value = 0;
  waltzLead.connect(leadGain).connect(master);
  waltzLead.start();
  cleanup.add(() => stopOscillator(context, waltzLead, leadGain));

  const leadPattern = [523.25, 587.33, 659.25, 698.46, 783.99, 659.25];
  let leadStep = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const freq = leadPattern[leadStep % leadPattern.length];
    try {
      waltzLead.frequency.setValueAtTime(freq, now);
      leadGain.gain.cancelScheduledValues(now);
      leadGain.gain.setValueAtTime(0.0001, now);
      leadGain.gain.linearRampToValueAtTime(0.05, now + 0.04);
      leadGain.gain.linearRampToValueAtTime(0.0001, now + 0.24);
    } catch (error) {
      // Ignore lead scheduling
    }
    leadStep += 1;
  }, 360);

  const sweep = context.createOscillator();
  sweep.type = 'sawtooth';
  const sweepGain = context.createGain();
  sweepGain.gain.value = 0.02;
  const sweepFilter = context.createBiquadFilter();
  sweepFilter.type = 'lowpass';
  sweepFilter.frequency.value = 1200;
  sweep.connect(sweepGain);
  sweepGain.connect(sweepFilter);
  sweepFilter.connect(master);
  sweep.start();
  cleanup.add(() => stopOscillator(context, sweep, sweepGain, [sweepFilter]));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      sweep.detune.setValueAtTime(Math.sin(now * 0.5) * 80, now);
      sweepFilter.frequency.cancelScheduledValues(now);
      sweepFilter.frequency.setValueAtTime(900, now);
      sweepFilter.frequency.linearRampToValueAtTime(1600, now + 0.4);
    } catch (error) {
      // Ignore sweep modulation
    }
  }, 480);

  return () => cleanup.dispose();
}

function createFluxLattice(context, master) {
  const cleanup = createCleanupRegistry();

  const lead = context.createOscillator();
  lead.type = 'triangle';
  const leadGain = context.createGain();
  leadGain.gain.value = 0.05;
  lead.connect(leadGain).connect(master);
  lead.start();
  cleanup.add(() => stopOscillator(context, lead, leadGain));

  const scale = [329.63, 349.23, 392, 415.3, 466.16, 440];
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const freq = scale[Math.floor(Math.random() * scale.length)];
    try {
      lead.frequency.setValueAtTime(freq, now);
      leadGain.gain.cancelScheduledValues(now);
      leadGain.gain.setValueAtTime(0.02, now);
      leadGain.gain.linearRampToValueAtTime(0.07, now + 0.05);
      leadGain.gain.linearRampToValueAtTime(0.02, now + 0.18);
    } catch (error) {
      // Ignore lead scheduling
    }
  }, 220);

  const sampleHold = context.createOscillator();
  sampleHold.type = 'square';
  const sampleGain = context.createGain();
  sampleGain.gain.value = 0;
  sampleHold.connect(sampleGain).connect(master);
  sampleHold.start();
  cleanup.add(() => stopOscillator(context, sampleHold, sampleGain));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    const freq = 55 + Math.random() * 110;
    try {
      sampleHold.frequency.setValueAtTime(freq, now);
      sampleGain.gain.cancelScheduledValues(now);
      sampleGain.gain.setValueAtTime(0.0001, now);
      sampleGain.gain.linearRampToValueAtTime(0.05, now + 0.04);
      sampleGain.gain.linearRampToValueAtTime(0.0001, now + 0.24);
    } catch (error) {
      // Ignore sample scheduling
    }
  }, 400);

  const hiss = context.createBufferSource();
  hiss.buffer = getNoiseBuffer(context);
  hiss.loop = true;
  const hissFilter = context.createBiquadFilter();
  hissFilter.type = 'highpass';
  hissFilter.frequency.value = 1500;
  const hissGain = context.createGain();
  hissGain.gain.value = 0.013;
  hiss.connect(hissFilter).connect(hissGain).connect(master);
  hiss.start();
  cleanup.add(() => stopBufferSource(context, hiss, hissGain, [hissFilter]));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      hissGain.gain.cancelScheduledValues(now);
      hissGain.gain.setValueAtTime(0.003, now);
      hissGain.gain.linearRampToValueAtTime(0.018, now + 0.06);
      hissGain.gain.linearRampToValueAtTime(0.003, now + 0.22);
    } catch (error) {
      // Ignore hiss modulation
    }
  }, 260);

  const drone = context.createOscillator();
  drone.type = 'sine';
  const droneGain = context.createGain();
  droneGain.gain.value = 0.03;
  drone.connect(droneGain).connect(master);
  drone.frequency.value = 98;
  drone.start();
  cleanup.add(() => stopOscillator(context, drone, droneGain));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      drone.frequency.setValueAtTime(98 + Math.sin(now * 0.4) * 8, now);
    } catch (error) {
      // Ignore drone modulation
    }
  }, 200);

  return () => cleanup.dispose();
}

function createMidnightCourier(context, master) {
  const cleanup = createCleanupRegistry();

  const lead = context.createOscillator();
  lead.type = 'sine';
  const leadGain = context.createGain();
  leadGain.gain.value = 0.06;
  lead.connect(leadGain).connect(master);
  lead.start();
  cleanup.add(() => stopOscillator(context, lead, leadGain));

  const harmony = context.createOscillator();
  harmony.type = 'triangle';
  const harmonyGain = context.createGain();
  harmonyGain.gain.value = 0.05;
  harmony.connect(harmonyGain).connect(master);
  harmony.start();
  cleanup.add(() => stopOscillator(context, harmony, harmonyGain));

  const chords = [
    [329.63, 493.88],
    [311.13, 466.16],
    [349.23, 523.25],
    [293.66, 440],
  ];
  let chordIndex = 0;
  cleanup.addInterval(() => {
    const now = context.currentTime;
    const [low, high] = chords[chordIndex % chords.length];
    try {
      lead.frequency.exponentialRampToValueAtTime(low, now + 0.6);
      harmony.frequency.exponentialRampToValueAtTime(high, now + 0.6);
    } catch (error) {
      // Ignore chord movement
    }
    chordIndex += 1;
  }, 1800);

  const pulse = context.createOscillator();
  pulse.type = 'sine';
  const pulseGain = context.createGain();
  pulseGain.gain.value = 0;
  pulse.connect(pulseGain).connect(master);
  pulse.start();
  cleanup.add(() => stopOscillator(context, pulse, pulseGain));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      pulse.frequency.setValueAtTime(110, now);
      pulseGain.gain.cancelScheduledValues(now);
      pulseGain.gain.setValueAtTime(0.0001, now);
      pulseGain.gain.linearRampToValueAtTime(0.05, now + 0.08);
      pulseGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    } catch (error) {
      // Ignore pulse scheduling
    }
  }, 900);

  const wash = context.createBufferSource();
  wash.buffer = getNoiseBuffer(context);
  wash.loop = true;
  const washFilter = context.createBiquadFilter();
  washFilter.type = 'lowpass';
  washFilter.frequency.value = 900;
  const washGain = context.createGain();
  washGain.gain.value = 0.02;
  wash.connect(washFilter).connect(washGain).connect(master);
  wash.start();
  cleanup.add(() => stopBufferSource(context, wash, washGain, [washFilter]));

  cleanup.addInterval(() => {
    const now = context.currentTime;
    try {
      washFilter.frequency.cancelScheduledValues(now);
      washFilter.frequency.setValueAtTime(700, now);
      washFilter.frequency.linearRampToValueAtTime(1200, now + 0.8);
      washGain.gain.cancelScheduledValues(now);
      washGain.gain.setValueAtTime(0.005, now);
      washGain.gain.linearRampToValueAtTime(0.025, now + 0.6);
      washGain.gain.linearRampToValueAtTime(0.005, now + 1.5);
    } catch (error) {
      // Ignore wash modulation
    }
  }, 1600);

  return () => cleanup.dispose();
}

const SOUNDTRACKS = [
  {
    id: 'neon-relay',
    name: 'Neon Relay',
    tagline: 'Laser sprint',
    description: 'Square-wave relays chase a sawtooth bass with crisp hats.',
    create: createNeonRelay,
  },
  {
    id: 'aurora-bloom',
    name: 'Aurora Bloom',
    tagline: 'Shimmer bloom',
    description: 'Layered pads drift through aurora chords with glassy plucks.',
    create: createAuroraBloom,
  },
  {
    id: 'circuit-dreams',
    name: 'Circuit Dreams',
    tagline: 'FM drift',
    description: 'A frequency-modulated lead ripples above glitching spark percussion.',
    create: createCircuitDreams,
  },
  {
    id: 'ion-drift',
    name: 'Ion Drift',
    tagline: 'Filter tides',
    description: 'Slow ionised pads sweep through resonant filters with sub pulses.',
    create: createIonDrift,
  },
  {
    id: 'night-runner',
    name: 'Night Runner',
    tagline: 'Midnight sprint',
    description: 'Driving pulses and sync bass propel a neon chase sequence.',
    create: createNightRunner,
  },
  {
    id: 'ghost-grid',
    name: 'Ghost Grid',
    tagline: 'Phase haze',
    description: 'Band-passed noise ghosts weave beneath crystalline bell pairs.',
    create: createGhostGrid,
  },
  {
    id: 'solar-echo',
    name: 'Solar Echo',
    tagline: 'Delay bloom',
    description: 'Triangular echoes bounce through solar delay lines and dub clicks.',
    create: createSolarEcho,
  },
  {
    id: 'prism-waltz',
    name: 'Prism Waltz',
    tagline: '3/4 shimmer',
    description: 'A waltzing chord carousel supports a prismatic lead shimmer.',
    create: createPrismWaltz,
  },
  {
    id: 'flux-lattice',
    name: 'Flux Lattice',
    tagline: 'Random flux',
    description: 'Sample-and-hold arps stutter over mechanical hiss and drones.',
    create: createFluxLattice,
  },
  {
    id: 'midnight-courier',
    name: 'Midnight Courier',
    tagline: 'Soft courier',
    description: 'Gentle sine duets and noise swells cruise the midnight loop.',
    create: createMidnightCourier,
  },
];

function normalizeIndex(index) {
  const length = SOUNDTRACKS.length;
  if (!length) return 0;
  return ((index % length) + length) % length;
}

function clearAutoAdvance() {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

function scheduleAutoAdvance() {
  clearAutoAdvance();
  if (!soundEnabled || !audioCtx || audioCtx.state !== 'running') {
    return;
  }
  autoAdvanceTimer = setTimeout(() => {
    selectTrack(currentTrackIndex + 1);
  }, TRACK_ADVANCE_INTERVAL);
}

function cleanupCurrentTrack() {
  if (trackCleanup) {
    try {
      trackCleanup();
    } catch (error) {
      // Ignore cleanup errors
    }
    trackCleanup = null;
  }
}

function saveSoundtrackSelection(trackId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(SOUNDTRACK_STORAGE_KEY, trackId);
  } catch (error) {
    // Ignore storage issues
  }
}

function readStoredSoundtrack() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(SOUNDTRACK_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function updateSoundButtons() {
  if (soundOnButton) {
    soundOnButton.classList.toggle('is-active', soundEnabled);
    soundOnButton.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
  }
  if (soundOffButton) {
    const offActive = !soundEnabled;
    soundOffButton.classList.toggle('is-active', offActive);
    soundOffButton.setAttribute('aria-pressed', offActive ? 'true' : 'false');
  }
}

function updateSoundtrackUI() {
  const track = SOUNDTRACKS[currentTrackIndex];
  if (soundtrackIndicator) {
    if (track) {
      soundtrackIndicator.textContent = soundEnabled
        ? `Track: ${track.name}`
        : `Track: ${track.name} (muted)`;
      soundtrackIndicator.classList.toggle('is-playing', soundEnabled);
    } else {
      soundtrackIndicator.textContent = soundEnabled ? 'Track: —' : 'Track: rotation paused';
      soundtrackIndicator.classList.remove('is-playing');
    }
  }

  if (soundtrackDescription) {
    soundtrackDescription.textContent = track ? track.description : '';
  }

  if (soundtrackList) {
    const buttons = soundtrackList.querySelectorAll('button[data-track-index]');
    buttons.forEach((button) => {
      const index = Number(button.dataset.trackIndex);
      const isActive = index === currentTrackIndex;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }
}

function selectTrack(index) {
  if (!SOUNDTRACKS.length) {
    updateSoundtrackUI();
    return;
  }

  currentTrackIndex = normalizeIndex(index);
  const track = SOUNDTRACKS[currentTrackIndex];

  clearAutoAdvance();

  if (soundEnabled) {
    const context = ensureAudioContext();
    if (context) {
      cleanupCurrentTrack();
      try {
        const maybeCleanup = track.create(context, masterGain);
        trackCleanup = typeof maybeCleanup === 'function' ? maybeCleanup : null;
      } catch (error) {
        trackCleanup = null;
      }
      scheduleAutoAdvance();
    }
  }

  saveSoundtrackSelection(track.id);
  updateSoundtrackUI();
}

async function powerSound(enable, targetIndex = null) {
  if (!enable) {
    clearAutoAdvance();
    cleanupCurrentTrack();
    if (audioCtx && audioCtx.state !== 'closed') {
      try {
        await audioCtx.suspend();
      } catch (error) {
        // Ignore suspend failures
      }
    }
    soundEnabled = false;
    updateSoundButtons();
    updateSoundtrackUI();
    return;
  }

  if (soundEnabled && targetIndex === null) {
    scheduleAutoAdvance();
    return;
  }

  const context = ensureAudioContext();
  if (!context) return;

  if (typeof targetIndex === 'number' && Number.isFinite(targetIndex)) {
    currentTrackIndex = normalizeIndex(targetIndex);
  }

  try {
    await context.resume();
  } catch (error) {
    // Ignore resume failures
  }

  soundEnabled = true;
  updateSoundButtons();
  selectTrack(currentTrackIndex);
}

function initializeSoundtrackControls() {
  const storedId = readStoredSoundtrack();
  const storedIndex = storedId ? SOUNDTRACKS.findIndex((track) => track.id === storedId) : -1;
  if (storedIndex >= 0) {
    currentTrackIndex = storedIndex;
  }

  if (!soundtrackList) {
    updateSoundtrackUI();
    return;
  }

  soundtrackList.innerHTML = '';
  SOUNDTRACKS.forEach((track, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'soundtrack-chip';
    button.dataset.trackIndex = String(index);
    button.setAttribute('aria-pressed', 'false');

    const title = document.createElement('span');
    title.className = 'soundtrack-chip__title';
    title.textContent = track.name;

    const meta = document.createElement('span');
    meta.className = 'soundtrack-chip__meta';
    meta.textContent = track.tagline;

    button.append(title, meta);

    button.addEventListener('click', () => {
      const target = Number(button.dataset.trackIndex) || 0;
      if (soundEnabled) {
        currentTrackIndex = normalizeIndex(target);
        selectTrack(currentTrackIndex);
      } else {
        powerSound(true, target);
      }
    });

    soundtrackList.appendChild(button);
  });

  updateSoundtrackUI();
}

if (soundOnButton) {
  soundOnButton.addEventListener('click', () => {
    powerSound(true);
  });
}

if (soundOffButton) {
  soundOffButton.addEventListener('click', () => {
    powerSound(false);
  });
}

initializeSoundtrackControls();
updateSoundButtons();
updateSoundtrackUI();

window.addEventListener('pagehide', () => {
  clearAutoAdvance();
  cleanupCurrentTrack();
  if (audioCtx && audioCtx.state !== 'closed') {
    audioCtx.close();
  }
});

// Text pulse effect
const statusEl = document.querySelector('[data-status-pulse]');
if (statusEl) {
  let visible = true;
  setInterval(() => {
    visible = !visible;
    statusEl.style.opacity = visible ? '1' : '0.45';
  }, 900);
}

// Applet launcher controls
const launcherDock = document.getElementById('launcherDock');
const launcherPanel = document.getElementById('launcherDockPanel');
const launcherToggle = document.getElementById('launcherDockToggle');
const fullscreenButton = document.getElementById('stageFullscreen');
const stage = document.getElementById('appletStage');
const stageTitle = document.getElementById('activeAppletTitle');
const stageStatus = document.getElementById('activeAppletStatus');
const stagePlaceholder = document.getElementById('appletPlaceholder');
const placeholderMessage = document.getElementById('appletPlaceholderMessage');
const appletFrame = document.getElementById('appletFrame');
const launcherButtons = Array.from(document.querySelectorAll('.launcher__button'));

let activeAppletId = null;
let launchersCollapsed = false;

function setLauncherCollapsed(collapsed) {
  if (!launcherToggle) return;
  launchersCollapsed = collapsed;
  if (launcherDock) {
    launcherDock.classList.toggle('launcher-dock--collapsed', collapsed);
  }
  if (launcherPanel) {
    launcherPanel.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
  }
  launcherToggle.textContent = collapsed ? 'Open Launch Bay' : 'Collapse Launch Bay';
  launcherToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

function setActiveLauncherButton(activeButton) {
  launcherButtons.forEach((button) => {
    const isActive = button === activeButton;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function updateStageForSelection(name, description) {
  if (stageTitle && typeof name === 'string') {
    stageTitle.textContent = name || 'Applet Screen';
  }
  if (stageStatus && typeof description === 'string') {
    stageStatus.textContent = description || 'Module ready.';
  }
}

function prepareStageLoading(name) {
  if (stageStatus) {
    stageStatus.textContent = `Initializing ${name}…`;
  }
  if (placeholderMessage) {
    placeholderMessage.textContent = `Initializing ${name}…`;
  }
  if (stagePlaceholder) {
    stagePlaceholder.hidden = false;
    stagePlaceholder.classList.remove('hero-screen__placeholder--hidden');
  }
  if (appletFrame) {
    appletFrame.hidden = true;
  }
}

function handleAppletSelection(button) {
  if (!button || !stage) return;
  const name = button.dataset.appletName || 'Applet Screen';
  const description = button.dataset.appletDesc || 'Module ready.';
  const url = button.dataset.appletUrl;
  const appletId = button.dataset.appletId || url || name;

  activeAppletId = appletId;
  setActiveLauncherButton(button);
  updateStageForSelection(name, null);

  if (!url) {
    updateStageForSelection(null, description || 'Module slot unconfigured.');
    if (placeholderMessage) {
      placeholderMessage.textContent = 'This slot is awaiting deployment.';
    }
    if (stagePlaceholder) {
      stagePlaceholder.hidden = false;
      stagePlaceholder.classList.remove('hero-screen__placeholder--hidden');
    }
    if (appletFrame) {
      appletFrame.hidden = true;
    }
    return;
  }

  if (appletFrame && appletFrame.dataset.loadedApplet === appletId) {
    updateStageForSelection(null, description);
    if (stagePlaceholder) {
      stagePlaceholder.hidden = true;
      stagePlaceholder.classList.add('hero-screen__placeholder--hidden');
    }
    appletFrame.hidden = false;
    return;
  }

  if (appletFrame) {
    prepareStageLoading(name);
    appletFrame.dataset.targetApplet = appletId;
    appletFrame.src = url;
  }
}

if (launcherToggle) {
  launcherToggle.addEventListener('click', () => {
    setLauncherCollapsed(!launchersCollapsed);
  });
}

launcherButtons.forEach((button) => {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    handleAppletSelection(button);
  });
});

if (appletFrame) {
  appletFrame.addEventListener('load', () => {
    if (!activeAppletId) return;
    const target = appletFrame.dataset.targetApplet;
    if (target && target !== activeAppletId) {
      return;
    }
    const activeButton = launcherButtons.find((button) => {
      const id = button.dataset.appletId || button.dataset.appletUrl || button.dataset.appletName;
      return id === activeAppletId;
    });
    const name = activeButton?.dataset.appletName || 'Applet Screen';
    const description = activeButton?.dataset.appletDesc || 'Module ready.';

    appletFrame.hidden = false;
    if (stagePlaceholder) {
      stagePlaceholder.hidden = true;
      stagePlaceholder.classList.add('hero-screen__placeholder--hidden');
    }
    updateStageForSelection(name, description);
    appletFrame.dataset.loadedApplet = activeAppletId;
    delete appletFrame.dataset.targetApplet;
  });
}

function isStageFullscreen() {
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
  return fullscreenElement === stage;
}

function updateFullscreenButton() {
  if (!fullscreenButton) return;
  const active = isStageFullscreen();
  fullscreenButton.textContent = active ? 'Exit Fullscreen' : 'Enter Fullscreen';
  fullscreenButton.setAttribute('aria-pressed', active ? 'true' : 'false');
}

if (fullscreenButton && stage) {
  fullscreenButton.addEventListener('click', async () => {
    if (isStageFullscreen()) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else if (stage.requestFullscreen) {
      try {
        await stage.requestFullscreen();
      } catch (error) {
        if (stage.webkitRequestFullscreen) {
          stage.webkitRequestFullscreen();
        }
      }
    } else if (stage.webkitRequestFullscreen) {
      stage.webkitRequestFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', updateFullscreenButton);
  document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
  updateFullscreenButton();
}

setLauncherCollapsed(false);
