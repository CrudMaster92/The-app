const TONE_OPTIONS = [
  "Friendly",
  "Confident",
  "Analytical",
  "Playful",
  "Formal",
  "Empathetic"
];

const FORMAT_OPTIONS = [
  "Bulleted steps",
  "Narrative walkthrough",
  "Checklist",
  "Talking points",
  "Table",
  "Code-first"
];

function createCard(title, subtitle) {
  const card = document.createElement("div");
  card.className = "card";

  const heading = document.createElement("h2");
  heading.textContent = title;
  const sub = document.createElement("p");
  sub.textContent = subtitle;

  card.append(heading, sub);
  return card;
}

function createTextarea(labelText, placeholder) {
  const wrapper = document.createElement("label");
  wrapper.className = "input-stack";
  wrapper.textContent = labelText;

  const textarea = document.createElement("textarea");
  textarea.rows = 2;
  textarea.placeholder = placeholder;
  textarea.className = "textarea";

  wrapper.append(textarea);
  return { wrapper, textarea };
}

function createSelect(labelText, options) {
  const wrapper = document.createElement("label");
  wrapper.className = "input-stack";
  wrapper.textContent = labelText;

  const select = document.createElement("select");
  for (const option of options) {
    const opt = document.createElement("option");
    opt.value = option;
    opt.textContent = option;
    select.append(opt);
  }

  wrapper.append(select);
  return { wrapper, select };
}

function createSlider(labelText, min, max, value, suffix = "") {
  const wrapper = document.createElement("label");
  wrapper.className = "input-stack";
  wrapper.textContent = labelText;

  const row = document.createElement("div");
  row.className = "input-row";

  const input = document.createElement("input");
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);

  const label = document.createElement("span");
  label.textContent = `${value}${suffix}`;

  input.addEventListener("input", () => {
    label.textContent = `${input.value}${suffix}`;
  });

  row.append(input, label);
  wrapper.append(row);
  return { wrapper, input };
}

function createToggle(labelText, defaultChecked = true) {
  const wrapper = document.createElement("label");
  wrapper.className = "toggle-row";

  const text = document.createElement("span");
  text.textContent = labelText;

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = defaultChecked;

  wrapper.append(text, input);
  return { wrapper, input };
}

function createPromptPreview() {
  const wrapper = document.createElement("div");
  wrapper.className = "card";

  const heading = document.createElement("h3");
  heading.textContent = "Live prompt";

  const code = document.createElement("pre");
  code.className = "code-snippet";
  const codeInner = document.createElement("code");
  codeInner.textContent = "";
  code.append(codeInner);

  const actions = document.createElement("div");
  actions.className = "button-row";

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "button";
  copyButton.textContent = "Copy prompt";

  const sendButton = document.createElement("button");
  sendButton.type = "button";
  sendButton.className = "button ghost";
  sendButton.textContent = "Send to ChatGPT";

  actions.append(copyButton, sendButton);
  wrapper.append(heading, code, actions);

  return { wrapper, codeInner, copyButton, sendButton };
}

function buildPrompt({
  goal,
  audience,
  tone,
  format,
  creativity,
  length,
  guardrails
}) {
  const safeAudience = audience?.trim() || "general readers";
  const safeGoal = goal?.trim() || "craft a concise answer";

  const sections = [
    "Act as a high-signal writing partner.",
    `Goal: ${safeGoal}.`,
    `Audience: ${safeAudience}. Tone: ${tone}.`
  ];

  if (format) {
    sections.push(`Delivery format: ${format}.`);
  }

  sections.push(
    `Inject ${creativity}/10 creativity while staying precise. Target about ${length} sentences.`
  );

  const rules = [];
  if (guardrails.examples) {
    rules.push("Open with a one-line TL;DR.");
  }
  if (guardrails.citations) {
    rules.push("Cite evidence or sources when possible.");
  }
  if (guardrails.limitations) {
    rules.push("Call out assumptions and uncertainties.");
  }

  if (rules.length) {
    sections.push(`Guardrails: ${rules.join(" ")}`);
  }

  sections.push(
    "Finish by asking: \"Anything to tighten or explore next?\""
  );

  return sections.join("\n");
}

export const applet = {
  id: "prompt-studio",
  name: "Prompt Studio",
  description: "Blend tone, format, and guardrails into a ready-to-launch prompt.",
  render(context = {}) {
    const container = createCard(
      "Prompt Studio",
      "Shape prompts with tone, format, and creative guardrails before you send."
    );

    const formGrid = document.createElement("div");
    formGrid.className = "dual-grid";

    const { wrapper: goalWrapper, textarea: goalInput } = createTextarea(
      "Outcome",
      "Draft a crisp product update for stakeholders"
    );
    const { wrapper: audienceWrapper, textarea: audienceInput } = createTextarea(
      "Audience",
      "PMs and engineering leads"
    );

    const { wrapper: toneWrapper, select: toneSelect } = createSelect(
      "Tone",
      TONE_OPTIONS
    );

    const { wrapper: formatWrapper, select: formatSelect } = createSelect(
      "Format",
      FORMAT_OPTIONS
    );

    const { wrapper: creativityWrapper, input: creativityInput } = createSlider(
      "Creative range",
      1,
      10,
      6,
      "/10"
    );

    const { wrapper: lengthWrapper, input: lengthInput } = createSlider(
      "Length",
      2,
      12,
      6,
      " sentences"
    );

    const guideCard = document.createElement("div");
    guideCard.className = "card";
    const guideHeading = document.createElement("h3");
    guideHeading.textContent = "Guardrails";
    const guideCopy = document.createElement("p");
    guideCopy.textContent = "Add structure to keep responses sharp and trustworthy.";

    const { wrapper: examplesToggle, input: examplesInput } = createToggle(
      "Lead with a one-line TL;DR"
    );
    const { wrapper: citationToggle, input: citationInput } = createToggle(
      "Cite evidence or sources when possible"
    );
    const { wrapper: assumptionsToggle, input: assumptionsInput } = createToggle(
      "Call out assumptions and unknowns"
    );

    guideCard.append(
      guideHeading,
      guideCopy,
      examplesToggle,
      citationToggle,
      assumptionsToggle
    );

    const { wrapper: previewCard, codeInner, copyButton, sendButton } =
      createPromptPreview();

    formGrid.append(
      goalWrapper,
      audienceWrapper,
      toneWrapper,
      formatWrapper,
      creativityWrapper,
      lengthWrapper
    );

    container.append(formGrid, guideCard, previewCard);

    function sync() {
      const prompt = buildPrompt({
        goal: goalInput.value,
        audience: audienceInput.value,
        tone: toneSelect.value,
        format: formatSelect.value,
        creativity: Number(creativityInput.value),
        length: Number(lengthInput.value),
        guardrails: {
          examples: examplesInput.checked,
          citations: citationInput.checked,
          limitations: assumptionsInput.checked
        }
      });

      codeInner.textContent = prompt;
      return prompt;
    }

    goalInput.addEventListener("input", sync);
    audienceInput.addEventListener("input", sync);
    toneSelect.addEventListener("change", sync);
    formatSelect.addEventListener("change", sync);
    creativityInput.addEventListener("input", sync);
    lengthInput.addEventListener("input", sync);
    examplesInput.addEventListener("change", sync);
    citationInput.addEventListener("change", sync);
    assumptionsInput.addEventListener("change", sync);

    copyButton.addEventListener("click", async () => {
      const prompt = sync();
      await navigator.clipboard.writeText(prompt);
      copyButton.textContent = "Copied!";
      setTimeout(() => {
        copyButton.textContent = "Copy prompt";
      }, 1200);
    });

    sendButton.addEventListener("click", async () => {
      const prompt = sync();
      sendButton.textContent = "Sending...";
      try {
        await context.applyPrompt?.(prompt);
        sendButton.textContent = "Sent to ChatGPT";
      } catch (error) {
        console.warn(error);
        sendButton.textContent = "Open chatgpt.com first";
      } finally {
        setTimeout(() => {
          sendButton.textContent = "Send to ChatGPT";
        }, 1400);
      }
    });

    sync();
    return container;
  }
};
