const ACTIONS = [
  {
    id: "clarify",
    label: "Clarify & tighten",
    description: "Ask the model to restate the last answer with crisp bullets and callouts.",
    buildPrompt: ({ latestAssistantText, latestUserText, depth, tone }) => `Based on the latest reply, rewrite the core guidance as ${
      depth <= 2 ? "3" : depth <= 4 ? "5" : "7"
    } bullet points. Use a ${tone} tone. Preserve key caveats.\n\nUser question: ${
      latestUserText || "(missing)"
    }\nModel reply to refine:\n${latestAssistantText}`
  },
  {
    id: "action-plan",
    label: "Action plan",
    description: "Turn the assistant reply into a sequenced plan with owners and deadlines.",
    buildPrompt: ({ latestAssistantText, tone }) => `Convert the response below into a concise action plan with 5 steps. Include an owner, a deliverable, and a suggested deadline per step. Tone: ${tone}.\n\nResponse to transform:\n${latestAssistantText}`
  },
  {
    id: "challenge",
    label: "Challenge the answer",
    description: "Probe for missing risks, counterpoints, or failure modes.",
    buildPrompt: ({ latestAssistantText }) => `Interrogate the answer below. List the top 4 risks, missing considerations, or counterexamples. End with one probing question to ask next.\n\nAnswer to scrutinize:\n${latestAssistantText}`
  },
  {
    id: "compare",
    label: "Compare options",
    description: "Request alternatives and a quick comparison table.",
    buildPrompt: ({ latestAssistantText, depth }) => `From the answer below, propose ${
      depth <= 2 ? "2" : depth <= 4 ? "3" : "4"
    } alternative approaches. Provide a comparison table with pros, cons, and when to pick each.\n\nOriginal answer:\n${latestAssistantText}`
  }
];

function createInput(labelText, inputEl) {
  const label = document.createElement("label");
  label.className = "input-stack";
  label.textContent = labelText;
  label.append(inputEl);
  return label;
}

function createInfoBlock(title, content) {
  const card = document.createElement("div");
  card.className = "card info-card";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const body = document.createElement("p");
  body.textContent = content;
  card.append(heading, body);
  return card;
}

function formatSnippet(text, limit = 220) {
  if (!text) return "(No text detected yet)";
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}…`;
}

function measureText(text = "") {
  const sentences = (text.match(/[.!?]+\s|\n/g) ?? []).length || 1;
  const questions = (text.match(/\?/g) ?? []).length;
  const bullets = (text.match(/^-|^\s*[-•]/gm) ?? []).length;
  return { sentences, questions, bullets };
}

export const applet = {
  id: "follow-up-lab",
  name: "Follow-up Lab",
  description: "Craft sharp follow-up prompts from the live thread and inject them instantly.",
  render(context = {}) {
    const container = document.createElement("div");
    container.className = "card";

    const heading = document.createElement("h2");
    heading.textContent = "Follow-up Lab";
    const subtitle = document.createElement("p");
    subtitle.textContent = "Sync the active ChatGPT thread, analyze the latest turn, then launch a tailored follow-up.";

    const stack = document.createElement("div");
    stack.className = "stack";

    const infoRow = document.createElement("div");
    infoRow.className = "dual-grid";

    const userInfo = createInfoBlock("Last user ask", "Waiting for sync…");
    const assistantInfo = createInfoBlock("Last assistant reply", "Waiting for sync…");

    const metricsRow = document.createElement("div");
    metricsRow.className = "pill-row";

    const controlRow = document.createElement("div");
    controlRow.className = "button-row";

    const refreshButton = document.createElement("button");
    refreshButton.type = "button";
    refreshButton.className = "button";
    refreshButton.textContent = "Sync live thread";

    const highlightButton = document.createElement("button");
    highlightButton.type = "button";
    highlightButton.className = "button ghost";
    highlightButton.textContent = "Jump to reply";

    controlRow.append(refreshButton, highlightButton);

    const toneSelect = document.createElement("select");
    ["crisp", "curious", "friendly", "executive"].forEach((tone) => {
      const option = document.createElement("option");
      option.value = tone;
      option.textContent = tone;
      toneSelect.append(option);
    });

    const depthSlider = document.createElement("input");
    depthSlider.type = "range";
    depthSlider.min = "1";
    depthSlider.max = "5";
    depthSlider.step = "1";
    depthSlider.value = "3";

    const controlsGrid = document.createElement("div");
    controlsGrid.className = "dual-grid";
    controlsGrid.append(createInput("Tone", toneSelect), createInput("Depth", depthSlider));

    const actionsCard = document.createElement("div");
    actionsCard.className = "card";
    const actionsHeading = document.createElement("h3");
    actionsHeading.textContent = "Follow-up templates";
    const actionGrid = document.createElement("div");
    actionGrid.className = "pill-grid";
    actionsCard.append(actionsHeading, actionGrid);

    const status = document.createElement("p");
    status.className = "applet-description";
    status.textContent = "Ready to sync the current tab.";

    stack.append(
      infoRow,
      metricsRow,
      controlsGrid,
      actionsCard,
      controlRow,
      status
    );

    container.append(heading, subtitle, stack);

    let latestSnapshot = null;

    function renderMetrics(snapshot) {
      metricsRow.innerHTML = "";
      const statList = [];
      if (snapshot.latestAssistant) {
        const { bullets, questions } = measureText(snapshot.latestAssistant.fullText);
        statList.push({ label: "Bullets", value: bullets });
        statList.push({ label: "Questions", value: questions });
        statList.push({ label: "Words", value: snapshot.latestAssistant.words });
      }
      statList.push({ label: "Messages", value: snapshot.counts.totalMessages });
      statList.push({ label: "Tokens est.", value: snapshot.estimatedTokens });

      for (const stat of statList) {
        const pill = document.createElement("div");
        pill.className = "pill";
        const label = document.createElement("p");
        label.className = "pill-label";
        label.textContent = stat.label;
        const value = document.createElement("strong");
        value.className = "pill-value";
        value.textContent = stat.value;
        pill.append(label, value);
        metricsRow.append(pill);
      }
    }

    function renderContext(snapshot) {
      userInfo.querySelector("p").textContent = formatSnippet(snapshot.latestUser);
      assistantInfo.querySelector("p").textContent = formatSnippet(snapshot.latestAssistant?.fullText);
      renderMetrics(snapshot);
    }

    async function syncSnapshot() {
      refreshButton.disabled = true;
      refreshButton.textContent = "Syncing…";
      status.textContent = "Connecting to chatgpt.com...";
      try {
        const response = await context.inspectThread?.();
        if (!response) throw new Error("Open chatgpt.com to sync.");
        if (!response.ok) throw new Error(response.error ?? "Unable to read the thread.");
        latestSnapshot = response.snapshot;
        renderContext(latestSnapshot);
        status.textContent = "Live thread synced. Choose a follow-up template.";
      } catch (error) {
        status.textContent = error?.message ?? String(error);
      } finally {
        refreshButton.disabled = false;
        refreshButton.textContent = "Sync live thread";
      }
    }

    refreshButton.addEventListener("click", syncSnapshot);

    highlightButton.addEventListener("click", async () => {
      highlightButton.textContent = "Locating…";
      try {
        const response = await context.highlightLastAssistant?.();
        if (!response?.ok) throw new Error(response?.error ?? "No assistant reply yet.");
        highlightButton.textContent = "Centered";
        status.textContent = "Latest assistant reply highlighted.";
      } catch (error) {
        highlightButton.textContent = "Jump to reply";
        status.textContent = error?.message ?? String(error);
      } finally {
        setTimeout(() => {
          highlightButton.textContent = "Jump to reply";
        }, 1100);
      }
    });

    ACTIONS.forEach((action) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "pill action-pill";
      const label = document.createElement("strong");
      label.textContent = action.label;
      const desc = document.createElement("p");
      desc.textContent = action.description;
      pill.append(label, desc);
      pill.addEventListener("click", async () => {
        if (!latestSnapshot?.latestAssistant) {
          status.textContent = "Sync the thread before sending a follow-up.";
          return;
        }
        const prompt = action.buildPrompt({
          latestAssistantText:
            latestSnapshot.latestAssistant.fullText || latestSnapshot.latestAssistant.preview,
          latestUserText: latestSnapshot.latestUser,
          depth: Number(depthSlider.value),
          tone: toneSelect.value
        });
        try {
          await context.applyPrompt?.(prompt);
          status.textContent = `Prompt injected: ${action.label}.`;
        } catch (error) {
          status.textContent = error?.message ?? "Failed to inject prompt.";
        }
      });
      actionGrid.append(pill);
    });

    syncSnapshot();
    return container;
  }
};
