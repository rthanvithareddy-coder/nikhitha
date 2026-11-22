# LinkPulse – Predictive Mobile Connectivity Failure Detection and Smart Recovery System

## Overview
LinkPulse is a client‑side web dashboard that simulates monitoring, predicting, and recovering from mobile connectivity failures. It is built with **HTML, CSS, and vanilla JavaScript** and runs locally using VS Code Live Server (or any static HTTP server).

## Features
- Dark navy & blue technology theme with responsive layout.
- Sidebar navigation shared across all pages.
- Real‑time‑like charts powered by Chart.js.
- Simple CSV dataset (`data/network_data.csv`).
- Prediction view with future failure probability chart.
- Recovery suggestions based on the predicted issue.
- History view with event log table.
- Settings page to change refresh interval, theme, and export data.

## Project Structure
```
LinkPulse/
├─ index.html            # Dashboard (home)
├─ monitor.html          # Real‑time monitoring charts
├─ prediction.html       # Failure predictions
├─ recovery.html         # Suggested recovery actions
├─ history.html          # Past events & logs
├─ settings.html         # User preferences
├─ css/
│   └─ style.css        # Global styling
├─ js/
│   ├─ main.js          # Global UI helpers (sidebar toggle, theme)
│   ├─ dataset.js       # CSV loader & parser
│   ├─ monitor.js       # Monitor page logic
│   ├─ prediction.js    # Prediction page logic
│   ├─ recovery.js      # Recovery page logic
│   ├─ history.js       # History page logic
│   └─ settings.js      # Settings page logic
├─ data/
│   └─ network_data.csv # Sample network metrics
└─ README.md             # This file
```

## Getting Started
1. Open the project folder in **VS Code**.
2. Right‑click `index.html` (or any page) and select **"Open with Live Server"**.
3. The dashboard will be available at `http://127.0.0.1:<port>/index.html`.
4. Use the sidebar to navigate between modules.

## Customisation
- Edit `css/style.css` to change colours or layout.
- Populate `data/network_data.csv` with real metrics; the JavaScript automatically parses the file.
- Adjust refresh intervals in **Settings → Refresh Interval**.

## License
MIT – feel free to adapt and extend.
