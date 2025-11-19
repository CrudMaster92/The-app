import { applet as fontPickerApplet } from "./applets/font-picker/applet.js";
import { applet as themeSelectorApplet } from "./applets/theme-selector/applet.js";

const applets = [fontPickerApplet, themeSelectorApplet];

function populateSelect(selectEl, descriptionEl) {
  for (const applet of applets) {
    const option = document.createElement("option");
    option.value = applet.id;
    option.textContent = applet.name;
    option.dataset.description = applet.description;
    selectEl.append(option);
  }

  const first = applets[0];
  descriptionEl.textContent = first?.description ?? "";
}

function renderApplet(appletId) {
  const host = document.getElementById("applet-container");
  host.innerHTML = "";
  const applet = applets.find((entry) => entry.id === appletId);
  if (!applet) return;
  host.append(applet.render());
}

function main() {
  const selectEl = document.getElementById("applet-select");
  const descriptionEl = document.getElementById("applet-description");

  populateSelect(selectEl, descriptionEl);
  const defaultId = selectEl.options[0]?.value;
  if (defaultId) {
    renderApplet(defaultId);
  }

  selectEl.addEventListener("change", (event) => {
    const option = event.target.selectedOptions[0];
    descriptionEl.textContent = option?.dataset.description ?? "";
    renderApplet(option?.value);
  });
}

document.addEventListener("DOMContentLoaded", main);
