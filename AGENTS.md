# Repository Instructions

- The `Dashboard/` directory hosts the main menu surface of the app and should remain decoupled from the individual applets.
- All modular features live in `Dashboard/Applets/`, and each applet must be implemented so it can be added or removed without affecting others or the Dashboard shell.
- Maintain the plug-and-play structure: no shared mutable state between applets unless explicitly brokered by the Dashboard.
