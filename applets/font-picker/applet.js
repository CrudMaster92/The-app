const FONT_FAMILIES = [
  "Inter",
  "Roboto",
  "Helvetica Neue",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Fira Code",
  "JetBrains Mono",
  "Comic Sans MS"
];

function createSelect() {
  const select = document.createElement("select");
  for (const family of FONT_FAMILIES) {
    const option = document.createElement("option");
    option.value = family;
    option.textContent = family;
    select.append(option);
  }
  return select;
}

function createSizeInput() {
  const wrapper = document.createElement("div");
  wrapper.className = "input-row";

  const range = document.createElement("input");
  range.type = "range";
  range.min = "12";
  range.max = "48";
  range.value = "18";
  range.step = "1";

  const label = document.createElement("span");
  label.textContent = `${range.value}px`;

  range.addEventListener("input", () => {
    label.textContent = `${range.value}px`;
  });

  wrapper.append(range, label);
  return { wrapper, range, label };
}

function createPreview() {
  const box = document.createElement("div");
  box.className = "preview-box";
  box.contentEditable = "true";
  box.textContent = "Type here to preview your font choices.";
  box.setAttribute("aria-label", "Font preview");
  return box;
}

function createCodeSnippet() {
  const wrapper = document.createElement("div");
  wrapper.className = "card";

  const heading = document.createElement("h2");
  heading.textContent = "CSS Snippet";

  const description = document.createElement("p");
  description.textContent = "Copy this CSS to apply the current selection.";

  const code = document.createElement("pre");
  code.className = "code-snippet";
  const codeInner = document.createElement("code");
  codeInner.textContent = "font-family: sans-serif;\nfont-size: 18px;";
  code.append(codeInner);

  const copy = document.createElement("button");
  copy.className = "copy-btn";
  copy.type = "button";
  copy.textContent = "Copy CSS";

  copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(codeInner.textContent);
    copy.textContent = "Copied!";
    setTimeout(() => {
      copy.textContent = "Copy CSS";
    }, 1200);
  });

  wrapper.append(heading, description, code, copy);
  return { wrapper, codeInner };
}

function updatePreview(preview, codeInner, fontFamily, fontSize) {
  preview.style.fontFamily = fontFamily;
  preview.style.fontSize = `${fontSize}px`;
  codeInner.textContent = `font-family: "${fontFamily}", sans-serif;\nfont-size: ${fontSize}px;`;
}

export const applet = {
  id: "font-picker",
  name: "Font Picker",
  description: "Pick a typeface and size, then copy the ready-to-use CSS.",
  render(context = {}) {
    const container = document.createElement("div");
    container.className = "card";

    const title = document.createElement("h2");
    title.textContent = "Font Picker";
    const subtitle = document.createElement("p");
    subtitle.textContent = "Preview typography choices and grab the CSS snippet.";

    const select = createSelect();
    const { wrapper: sizeWrapper, range, label } = createSizeInput();
    const preview = createPreview();
    const { wrapper: codeCard, codeInner } = createCodeSnippet();

    const controls = document.createElement("div");
    controls.className = "card";
    controls.append(select, sizeWrapper);

    container.append(title, subtitle, controls, preview, codeCard);

    function sync() {
      const fontFamily = select.value;
      const fontSize = Number(range.value);
      updatePreview(preview, codeInner, fontFamily, fontSize);
      Promise.resolve(context.applyFontSettings?.({ fontFamily, fontSize })).catch(() => {});
    }

    select.addEventListener("change", sync);
    range.addEventListener("input", sync);

    sync();

    return container;
  }
};
