# Applet Instructions

- Each applet must be entirely self-contained and independent from other applets.
- Applets may only interact with the Dashboard through explicit interfaces exposed by the Dashboard layer.
- Avoid shared state between applets. Any shared utilities must live outside `Dashboard/Applets/` and be stable for all applets.

## Registered Applets
- **Signal Chat** (`SignalChat/index.html`): Secure field communications relay and simulated operations chat.
- **ChatGPT Clone** (`ChatGPTClone/index.html`): Experimental language analysis console.
- **Gemini Chat** (`GeminiChat/index.html`): Advanced language analysis console with Gemini.
- **Boolean Search Builder** (`BooleanSearchBuilder/index.html`): Guided boolean query composer with LLM drafting assistance.

Keep this list in sync as applets are added or removed so future agents know what modules ship with the dashboard.
