(function () {
  const statusEl = document.getElementById('cabinetStatus');
  const sessionLabel = document.getElementById('sessionLabel');
  const playlist = document.getElementById('playlist');
  const emptyHint = document.getElementById('emptyHint');
  const detailTitle = document.getElementById('detailTitle');
  const detailDescription = document.getElementById('detailDescription');
  const detailMeta = document.getElementById('detailMeta');
  const launchButton = document.getElementById('launchButton');
  const manifestScript = document.getElementById('appletManifest');

  let registry = [];

  function setStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle('cabinet__status--error', Boolean(isError));
  }

  function setSession(sessionCode) {
    if (sessionLabel && sessionCode) {
      sessionLabel.textContent = `Session ${sessionCode}`;
    }
  }

  function clearDetail() {
    if (detailTitle) {
      detailTitle.textContent = 'Select a module';
    }
    if (detailDescription) {
      detailDescription.textContent = 'Choose a game from the playlist to deploy a standalone run.';
    }
    if (detailMeta) {
      detailMeta.innerHTML = '';
    }
    if (launchButton) {
      launchButton.disabled = true;
      delete launchButton.dataset.url;
    }
  }

  function createMetaRow(label, value) {
    if (!value) return null;
    const fragment = document.createDocumentFragment();
    const term = document.createElement('dt');
    term.textContent = label;
    const definition = document.createElement('dd');
    definition.textContent = value;
    fragment.append(term, definition);
    return fragment;
  }

  function updateDetail(entry) {
    if (!entry) {
      clearDetail();
      return;
    }
    if (detailTitle) {
      detailTitle.textContent = entry.name || 'Unknown build';
    }
    if (detailDescription) {
      detailDescription.textContent = entry.description || 'Standalone module.';
    }
    if (detailMeta) {
      detailMeta.innerHTML = '';
      const rows = [
        createMetaRow('Category', entry.category),
        createMetaRow('Difficulty', entry.difficulty),
        createMetaRow('Est. Runtime', entry.estRuntime),
      ].filter(Boolean);
      rows.forEach((fragment) => detailMeta.appendChild(fragment));
    }
    if (launchButton) {
      launchButton.disabled = !entry.url;
      if (entry.url) {
        launchButton.dataset.url = entry.url;
      } else {
        delete launchButton.dataset.url;
      }
    }
  }

  function setActiveButton(activeButton) {
    if (!playlist) return;
    Array.from(playlist.querySelectorAll('.cabinet__button')).forEach((button) => {
      button.classList.toggle('is-active', button === activeButton);
    });
  }

  function handleSelection(entry, button) {
    setActiveButton(button);
    updateDetail(entry);
  }

  function renderRegistry(entries) {
    if (!playlist) return;
    playlist.innerHTML = '';

    if (!Array.isArray(entries) || entries.length === 0) {
      if (emptyHint) {
        emptyHint.hidden = false;
      }
      clearDetail();
      return;
    }

    if (emptyHint) {
      emptyHint.hidden = true;
    }

    entries.forEach((entry) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cabinet__button';
      button.textContent = entry.name || 'Untitled build';
      button.dataset.appletId = entry.id || '';
      button.addEventListener('click', () => handleSelection(entry, button));
      item.appendChild(button);
      playlist.appendChild(item);
    });

    const initial = entries[0];
    const firstButton = playlist.querySelector('.cabinet__button');
    if (firstButton) {
      handleSelection(initial, firstButton);
    }
  }

  function openApplet() {
    const targetUrl = launchButton?.dataset.url;
    if (!targetUrl) return;
    window.open(targetUrl, '_blank');
  }

  function parseManifest() {
    if (!manifestScript) {
      throw new Error('Applet manifest script tag missing.');
    }
    const raw = manifestScript.textContent || manifestScript.innerText;
    if (!raw) {
      throw new Error('Applet manifest is empty.');
    }
    try {
      const data = JSON.parse(raw);
      registry = Array.isArray(data.applets) ? data.applets : [];
      if (typeof data.session === 'string') {
        setSession(data.session);
      }
      return registry;
    } catch (error) {
      throw new Error('Applet manifest could not be parsed.');
    }
  }

  function initialize() {
    try {
      const entries = parseManifest();
      if (!entries || entries.length === 0) {
        setStatus('NO REGISTERED BUILDS FOUND.', true);
        renderRegistry(entries);
        return;
      }
      setStatus('SELECT A GAME TO LAUNCH A STANDALONE PLAYTEST SIMULATION.');
      renderRegistry(entries);
    } catch (error) {
      console.warn(error);
      setStatus('FAILED TO LOAD APPLET REGISTRY.', true);
      clearDetail();
      if (emptyHint) {
        emptyHint.hidden = false;
        emptyHint.textContent = 'Unable to read registry. See console for details.';
      }
    }
  }

  if (launchButton) {
    launchButton.addEventListener('click', openApplet);
  }

  initialize();
})();
