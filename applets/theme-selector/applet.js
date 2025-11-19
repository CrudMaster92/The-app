const THEMES = [
  {
    id: "midnight",
    name: "Midnight Neon",
    description: "Deep blues with electric accents for late-night focus.",
    colors: {
      bg: "#050816",
      panel: "#0f172a",
      border: "#1d2845",
      text: "#f8fafc",
      muted: "#94a3b8",
      accent: "#60a5fa"
    }
  },
  {
    id: "sunset",
    name: "Sunset Punch",
    description: "Warm violets and oranges inspired by evening gradients.",
    colors: {
      bg: "#1a0f19",
      panel: "#2b1431",
      border: "#3d1d48",
      text: "#fff7ed",
      muted: "#f9a8d4",
      accent: "#fb7185"
    }
  },
  {
    id: "glacier",
    name: "Glacier Mint",
    description: "Cool teals with crisp highlights for a minimal feel.",
    colors: {
      bg: "#041618",
      panel: "#0a2426",
      border: "#123438",
      text: "#e0f2fe",
      muted: "#7dd3fc",
      accent: "#34d399"
    }
  }
];

function createThemeSelect() {
  const wrapper = document.createElement("label");
  wrapper.className = "input-stack";
  wrapper.textContent = "Color theme";

  const select = document.createElement("select");
  for (const theme of THEMES) {
    const option = document.createElement("option");
    option.value = theme.id;
    option.textContent = theme.name;
    option.dataset.description = theme.description;
    select.append(option);
  }

  wrapper.append(select);
  return { wrapper, select };
}

function createModifierControl(labelText, min, max, value, suffix = "") {
  const wrapper = document.createElement("label");
  wrapper.className = "input-stack";
  wrapper.textContent = labelText;

  const row = document.createElement("div");
  row.className = "input-row";

  const range = document.createElement("input");
  range.type = "range";
  range.min = String(min);
  range.max = String(max);
  range.value = String(value);

  const label = document.createElement("span");
  label.textContent = `${value}${suffix}`;

  range.addEventListener("input", () => {
    label.textContent = `${range.value}${suffix}`;
  });

  row.append(range, label);
  wrapper.append(row);

  return { wrapper, range };
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")
  );
}

function shiftChannel(channel, percent) {
  if (percent === 0) return channel;
  if (percent > 0) {
    return Math.round(channel + (255 - channel) * (percent / 100));
  }
  return Math.round(channel * (1 + percent / 100));
}

function shiftColor(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const rShift = shiftChannel(r, percent);
  const gShift = shiftChannel(g, percent);
  const bShift = shiftChannel(b, percent);
  return rgbToHex(rShift, gShift, bShift);
}

function isColorLight(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

function getModifiedColors(themeColors, modifiers) {
  return {
    bg: shiftColor(themeColors.bg, modifiers.surface),
    panel: shiftColor(themeColors.panel, modifiers.surface),
    border: shiftColor(themeColors.border, modifiers.surface * 0.8),
    text: themeColors.text,
    muted: themeColors.muted,
    accent: shiftColor(themeColors.accent, modifiers.accent)
  };
}

function createPalettePreview() {
  const wrapper = document.createElement("div");
  wrapper.className = "theme-preview card";

  const heading = document.createElement("h3");
  heading.textContent = "Live preview";
  wrapper.append(heading);

  const swatchGrid = document.createElement("div");
  swatchGrid.className = "swatch-grid";
  wrapper.append(swatchGrid);

  return { wrapper, swatchGrid };
}

function createSwatch(name) {
  const swatch = document.createElement("div");
  swatch.className = "swatch";
  const label = document.createElement("p");
  label.textContent = name;
  swatch.append(label);
  return { swatch, label };
}

function createCodeBlock() {
  const wrapper = document.createElement("div");
  wrapper.className = "card";

  const heading = document.createElement("h3");
  heading.textContent = "CSS Variables";

  const code = document.createElement("pre");
  code.className = "code-snippet";
  const codeInner = document.createElement("code");
  code.append(codeInner);

  wrapper.append(heading, code);
  return { wrapper, codeInner };
}

function colorsToSnippet(colors) {
  return Object.entries(colors)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n");
}

export const applet = {
  id: "theme-selector",
  name: "Theme Selector",
  description: "Switch between curated palettes and tweak them with color modifiers.",
  render(context = {}) {
    const container = document.createElement("div");
    container.className = "card";

    const title = document.createElement("h2");
    title.textContent = "Theme Selector";
    const subtitle = document.createElement("p");
    subtitle.textContent = "Pick a palette and adjust surface/accent intensity to recolor ChatGPT.";

    const { wrapper: selectWrapper, select } = createThemeSelect();
    const themeDescription = document.createElement("p");
    themeDescription.className = "theme-description";
    themeDescription.textContent = THEMES[0].description;
    const { wrapper: surfaceWrapper, range: surfaceRange } = createModifierControl(
      "Surface depth",
      -30,
      30,
      0,
      "%"
    );
    const { wrapper: accentWrapper, range: accentRange } = createModifierControl(
      "Accent punch",
      -30,
      30,
      0,
      "%"
    );

    const { wrapper: previewCard, swatchGrid } = createPalettePreview();
    const swatchNames = ["Background", "Panel", "Border", "Text", "Muted", "Accent"];
    const swatchElements = swatchNames.map((name) => {
      const { swatch, label } = createSwatch(name);
      swatchGrid.append(swatch);
      return { swatch, label, key: name.toLowerCase() };
    });

    const { wrapper: codeCard, codeInner } = createCodeBlock();

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "button ghost";
    resetButton.textContent = "Reset modifiers";

    resetButton.addEventListener("click", () => {
      surfaceRange.value = "0";
      accentRange.value = "0";
      surfaceRange.dispatchEvent(new Event("input"));
      accentRange.dispatchEvent(new Event("input"));
      sync();
    });

    function sync() {
      const theme = THEMES.find((entry) => entry.id === select.value) ?? THEMES[0];
      themeDescription.textContent = theme.description;
      const colors = getModifiedColors(theme.colors, {
        surface: Number(surfaceRange.value),
        accent: Number(accentRange.value)
      });
      updatePreview(colors);
      codeInner.textContent = `:root {\n${colorsToSnippet(colors)}\n}`;
      Promise.resolve(context.applyTheme?.(colors)).catch(() => {});
    }

    function updatePreview(colors) {
      const mapping = {
        background: colors.bg,
        panel: colors.panel,
        border: colors.border,
        text: colors.text,
        muted: colors.muted,
        accent: colors.accent
      };
      for (const item of swatchElements) {
        const value = mapping[item.key];
        item.swatch.style.background = value;
        item.swatch.style.borderColor = value;
        item.label.textContent = `${item.key.replace(/\b\w/g, (c) => c.toUpperCase())}\n${value}`;
        const readableColor = isColorLight(value) ? "#020617" : "#f8fafc";
        item.swatch.style.color = readableColor;
      }
    }

    select.addEventListener("change", sync);
    surfaceRange.addEventListener("input", sync);
    accentRange.addEventListener("input", sync);

    container.append(
      title,
      subtitle,
      selectWrapper,
      themeDescription,
      surfaceWrapper,
      accentWrapper,
      resetButton,
      previewCard,
      codeCard
    );

    sync();
    return container;
  }
};
