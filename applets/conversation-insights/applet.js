const STAT_LABELS = {
  totalMessages: "Messages",
  userMessages: "User turns",
  assistantMessages: "Assistant turns",
  words: "Words",
  estimatedTokens: "Est. tokens",
  codeBlocks: "Code blocks",
  readingMinutes: "Read time"
};

function createStatPill(label, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "stat-pill";

  const labelEl = document.createElement("p");
  labelEl.className = "stat-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("strong");
  valueEl.className = "stat-value";
  valueEl.textContent = value;

  wrapper.append(labelEl, valueEl);
  return wrapper;
}

function createInsightList(title) {
  const wrapper = document.createElement("div");
  wrapper.className = "card";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const list = document.createElement("ul");
  list.className = "insight-list";

  wrapper.append(heading, list);
  return { wrapper, list };
}

function formatMinutes(minutes) {
  if (!minutes) return "< 1 min";
  if (minutes < 0.95) return `${minutes.toFixed(1)} min`;
  return `${Math.round(minutes)} min`;
}

export const applet = {
  id: "conversation-insights",
  name: "Conversation Insights",
  description: "Pull metrics from the live chat, spotlight the latest reply, and export markdown.",
  render(context = {}) {
    const container = document.createElement("div");
    container.className = "card";

    const heading = document.createElement("h2");
    heading.textContent = "Conversation Insights";
    const subtitle = document.createElement("p");
    subtitle.textContent = "Inspect the active ChatGPT thread, highlight the newest answer, and grab a shareable export.";

    const statGrid = document.createElement("div");
    statGrid.className = "stat-grid";

    const insightSection = createInsightList("Signals");
    const actionSection = createInsightList("Actions");

    const latestCard = document.createElement("div");
    latestCard.className = "card";
    const latestHeading = document.createElement("h3");
    latestHeading.textContent = "Latest assistant reply";
    const latestPreview = document.createElement("p");
    latestPreview.className = "latest-preview";
    latestPreview.textContent = "No assistant reply found yet.";
    latestCard.append(latestHeading, latestPreview);

    const buttonRow = document.createElement("div");
    buttonRow.className = "button-row triple";

    const refreshButton = document.createElement("button");
    refreshButton.type = "button";
    refreshButton.className = "button";
    refreshButton.textContent = "Refresh metrics";

    const highlightButton = document.createElement("button");
    highlightButton.type = "button";
    highlightButton.className = "button ghost";
    highlightButton.textContent = "Highlight reply";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "button";
    copyButton.textContent = "Copy export";

    buttonRow.append(refreshButton, highlightButton, copyButton);

    container.append(
      heading,
      subtitle,
      statGrid,
      latestCard,
      insightSection.wrapper,
      actionSection.wrapper,
      buttonRow
    );

    let latestSnapshot = null;

    function renderStats(snapshot) {
      statGrid.innerHTML = "";
      const stats = {
        totalMessages: snapshot.counts.totalMessages,
        userMessages: snapshot.counts.userMessages,
        assistantMessages: snapshot.counts.assistantMessages,
        words: snapshot.counts.words,
        estimatedTokens: snapshot.estimatedTokens,
        codeBlocks: snapshot.counts.codeBlocks,
        readingMinutes: formatMinutes(snapshot.readingMinutes)
      };

      for (const [key, value] of Object.entries(stats)) {
        statGrid.append(createStatPill(STAT_LABELS[key] ?? key, value));
      }
    }

    function renderInsights(snapshot) {
      insightSection.list.innerHTML = "";
      const bullets = snapshot.actionableBullets?.length
        ? snapshot.actionableBullets
        : ["No bullet points detected in the latest reply."];

      for (const line of bullets) {
        const li = document.createElement("li");
        li.textContent = line;
        insightSection.list.append(li);
      }

      actionSection.list.innerHTML = "";
      const actions = [];
      if (snapshot.latestUser) {
        actions.push(`Last user ask: “${snapshot.latestUser.slice(0, 120)}${
          snapshot.latestUser.length > 120 ? "…" : ""
        }”`);
      }
      if (snapshot.latestAssistant) {
        actions.push(`Latest reply length: ${snapshot.latestAssistant.words} words`);
      }
      actions.push(`Reading time: ${formatMinutes(snapshot.readingMinutes)}`);
      actions.push(`Estimated tokens: ${snapshot.estimatedTokens}`);

      for (const line of actions) {
        const li = document.createElement("li");
        li.textContent = line;
        actionSection.list.append(li);
      }
    }

    function updateLatestCard(snapshot) {
      if (snapshot.latestAssistant) {
        latestPreview.textContent = snapshot.latestAssistant.preview || "(No text detected)";
      } else {
        latestPreview.textContent = "No assistant reply found yet.";
      }
    }

    async function refresh() {
      refreshButton.disabled = true;
      refreshButton.textContent = "Syncing...";
      try {
        const response = await context.inspectThread?.();
        if (!response) throw new Error("Open chatgpt.com to inspect the thread.");
        if (!response.ok) throw new Error(response.error ?? "Unable to inspect thread.");
        latestSnapshot = response.snapshot;
        renderStats(latestSnapshot);
        renderInsights(latestSnapshot);
        updateLatestCard(latestSnapshot);
      } catch (error) {
        latestPreview.textContent = error?.message ?? String(error);
      } finally {
        refreshButton.disabled = false;
        refreshButton.textContent = "Refresh metrics";
      }
    }

    refreshButton.addEventListener("click", refresh);

    highlightButton.addEventListener("click", async () => {
      highlightButton.textContent = "Locating...";
      try {
        const response = await context.highlightLastAssistant?.();
        if (!response?.ok) {
          throw new Error(response?.error ?? "No assistant reply to highlight.");
        }
        highlightButton.textContent = "Highlighted";
      } catch (error) {
        highlightButton.textContent = error?.message ?? String(error);
      } finally {
        setTimeout(() => {
          highlightButton.textContent = "Highlight reply";
        }, 1300);
      }
    });

    copyButton.addEventListener("click", async () => {
      copyButton.textContent = "Copying...";
      try {
        if (!latestSnapshot) {
          await refresh();
        }
        if (!latestSnapshot) throw new Error("No snapshot yet.");
        await navigator.clipboard.writeText(latestSnapshot.exportMarkdown);
        copyButton.textContent = "Copied";
      } catch (error) {
        copyButton.textContent = error?.message ?? "Copy failed";
      } finally {
        setTimeout(() => {
          copyButton.textContent = "Copy export";
        }, 1400);
      }
    });

    refresh();
    return container;
  }
};
