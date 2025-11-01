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

// Cracktro sound generator
let audioCtx;
let arpeggioTimer;
let bassTimer;
let soundEnabled = false;
const soundButton = document.getElementById('soundToggle');

function updateSoundToggleButton(isEnabled) {
  if (!soundButton) return;
  soundButton.classList.toggle('is-active', Boolean(isEnabled));
  soundButton.textContent = isEnabled ? 'Sound On' : 'Sound Off';
  soundButton.setAttribute('aria-pressed', isEnabled ? 'true' : 'false');
}

updateSoundToggleButton(soundEnabled);

function createNoiseBuffer(context) {
  const bufferSize = context.sampleRate * 2;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function startSoundtrack() {
  if (soundEnabled) return;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }

  const master = audioCtx.createGain();
  master.gain.value = 0.18;
  master.connect(audioCtx.destination);

  // Lead arpeggio voice
  const lead = audioCtx.createOscillator();
  lead.type = 'square';
  const leadGain = audioCtx.createGain();
  leadGain.gain.value = 0.12;
  lead.connect(leadGain).connect(master);
  lead.start();

  const arpeggio = [440, 554.37, 659.25, 880, 659.25, 554.37];
  let step = 0;
  arpeggioTimer = setInterval(() => {
    const now = audioCtx.currentTime;
    const target = arpeggio[step % arpeggio.length];
    lead.frequency.exponentialRampToValueAtTime(target, now + 0.1);
    leadGain.gain.cancelScheduledValues(now);
    leadGain.gain.setValueAtTime(0.02, now);
    leadGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    leadGain.gain.linearRampToValueAtTime(0.04, now + 0.18);
    step += 1;
  }, 180);

  // Bass pulse
  const bass = audioCtx.createOscillator();
  bass.type = 'sawtooth';
  const bassGain = audioCtx.createGain();
  bassGain.gain.value = 0.05;
  bass.connect(bassGain).connect(master);
  bass.start();

  const bassPattern = [110, 110, 164.81, 110, 82.41, 123.47];
  let bassStep = 0;
  bassTimer = setInterval(() => {
    const now = audioCtx.currentTime;
    const freq = bassPattern[bassStep % bassPattern.length];
    bass.frequency.setValueAtTime(freq, now);
    bassGain.gain.cancelScheduledValues(now);
    bassGain.gain.setValueAtTime(0.01, now);
    bassGain.gain.linearRampToValueAtTime(0.08, now + 0.04);
    bassGain.gain.linearRampToValueAtTime(0.02, now + 0.22);
    bassStep += 1;
  }, 220);

  // Noise hi-hats
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = createNoiseBuffer(audioCtx);
  noiseSource.loop = true;
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 4000;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0.05;
  noiseSource.connect(noiseFilter).connect(noiseGain).connect(master);
  noiseSource.start();

  const pulse = () => {
    const now = audioCtx.currentTime;
    noiseGain.gain.cancelScheduledValues(now);
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.05, now + 0.02);
    noiseGain.gain.linearRampToValueAtTime(0.005, now + 0.08);
  };
  const hatInterval = setInterval(pulse, 150);

  soundEnabled = true;
  updateSoundToggleButton(true);

  const cleanup = () => {
    clearInterval(arpeggioTimer);
    clearInterval(bassTimer);
    clearInterval(hatInterval);
  };

  window.addEventListener(
    'pagehide',
    () => {
      cleanup();
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    },
    { once: true }
  );
}

const toggle = document.getElementById('soundToggle');
if (toggle) {
  toggle.addEventListener('click', async () => {
    if (!audioCtx) {
      startSoundtrack();
      return;
    }

    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
      soundEnabled = true;
      updateSoundToggleButton(true);
    } else if (audioCtx.state === 'running') {
      await audioCtx.suspend();
      soundEnabled = false;
      updateSoundToggleButton(false);
    }
  });
}

// Text pulse effect
const statusEl = document.querySelector('.status');
if (statusEl) {
  let visible = true;
  setInterval(() => {
    visible = !visible;
    statusEl.style.opacity = visible ? '1' : '0.45';
  }, 900);
}

// Applet launcher controls
const workspace = document.querySelector('.workspace');
const launcherPanel = document.getElementById('launcherPanel');
const launcherToggle = document.getElementById('toggleLauncher');
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
  if (!workspace || !launcherToggle) return;
  launchersCollapsed = collapsed;
  workspace.classList.toggle('workspace--launchers-hidden', collapsed);
  if (launcherPanel) {
    launcherPanel.hidden = collapsed;
  }
  launcherToggle.textContent = collapsed ? 'Show Launchers' : 'Hide Launchers';
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
