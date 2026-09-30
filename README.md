# 📅 Calendar-Notes-Discord

A lightweight, self-hosted, mobile-first calendar and markdown note-taking system with integrated Discord alert capabilities.

Built with a zero-overhead architecture designed to run on personal servers or local machines (macOS/Linux) and seamlessly accessible on smartphones over [Tailscale](https://tailscale.com) or local Wi-Fi.

---

## 🌟 Key Features

- **📱 Mobile-First PWA:** Installable as an app on iOS (Safari: *Add to Home Screen*) and Android (Chrome: *Install App*).
- **🗓️ Interactive Calendar:**
  - Month view with day-by-day navigation and quick date jumps.
  - Color-coded event categories (*Work*, *Personal*, *Urgent*, *Routine*).
  - Time ranges and agenda summaries.
- **📝 Markdown Notes System:**
  - Live split-view Markdown editing with instant preview.
  - Tag-based organization (`#ideas`, `#todo`, `#projects`).
  - Search across note titles and content.
  - Pinned notes for quick access.
  - Date-linking (associate notes with specific calendar days).
- **🔔 Discord Integration Gateway:**
  - Discord Webhook support for real-time calendar reminders.
  - Configurable alert timing (*at time of event*, *15m before*, *1h before*, *1d before*).
  - Interactive simulated Discord embed preview in the UI.
- **💾 Local Persistence & Backups:**
  - Immediate client-side persistence out of the box.
  - One-click JSON backup export and restore.
- **⚡ Zero Build Dependencies Required:**
  - Runs directly with Python 3 out-of-the-box. No mandatory Node/npm build step needed.

---

## 🚀 Getting Started

### 1. Run the App

From the repository root, start the local server:

```bash
python3 run.py
```

The terminal will display your local access URLs:
```
============================================================
  🚀 Calendar-Notes-Discord is starting up!
============================================================
  Local access:       http://localhost:8000
  LAN access:         http://192.168.x.y:8000
  Tailscale (Mobile): http://100.x.y.z:8000
============================================================
```

### 2. Mobile Access over Tailscale

1. Make sure [Tailscale](https://tailscale.com) is running on both your host machine (Mac) and your phone.
2. On your phone, open your mobile browser to `http://<your-tailscale-ip>:8000`.
3. **Install as App:**
   - **iOS:** Tap the **Share** button &rarr; tap **Add to Home Screen**.
   - **Android:** Tap **More (...)** &rarr; tap **Install App** or **Add to Home screen**.

---

## 🛠️ Project Structure

```
Calendar-Notes-Discord/
├── run.py                 # One-command server runner
├── requirements.txt       # Optional backend dependencies (FastAPI, discord.py)
├── app/
│   ├── __init__.py
│   ├── server.py          # FastAPI application & API router
│   └── static/            # Responsive PWA frontend
│       ├── index.html     # Main Single Page Application shell
│       ├── manifest.json  # PWA installation manifest
│       ├── sw.js          # Service worker for offline caching
│       ├── css/
│       │   └── app.css    # Custom mobile & typography styling
│       └── js/
│           ├── app.js     # Router, modals, toast alerts & Discord settings
│           ├── calendar.js# Calendar state, month grid & event management
│           └── notes.js   # Markdown notes, tagging & live preview
```

---

## 🔮 Roadmap

- [x] Responsive Mobile PWA Frontend
- [x] Calendar & Agenda Views
- [x] Markdown Note Editor with Live Preview
- [x] Webhook Alert Preview & Configuration
- [ ] SQLite/SQLAlchemy Database Persistence
- [ ] Discord Bot Service (slash commands for `/calendar` and `/note`)
- [ ] Background Scheduled Notification Dispatcher

---

## 📄 License

MIT License. Open source and free for personal and community use.
