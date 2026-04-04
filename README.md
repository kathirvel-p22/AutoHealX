# 🛡️ AutoHealX — Self-Healing System Monitor

> **"AutoHealX automatically detects and resolves system failures in real-time, reducing downtime without human intervention."**

---

## 🏆 What Is AutoHealX?

AutoHealX is an intelligent, real-time self-healing system that:
- **Monitors** your PC's CPU, memory, and processes every 3 seconds
- **Detects** anomalies using rule-based logic + trend analysis
- **Alerts** the user and dashboard instantly via Firebase
- **Heals** automatically (or suggests fixes) with logged audit trails
- **Learns** from past fixes to improve future decisions

---

## 🧠 Architecture

```
[Node.js Agent — runs on your PC]
        ↓  writes metrics/alerts/fixes
[Firebase Firestore — real-time cloud sync]
        ↓  onSnapshot listeners
[React Dashboard — runs in browser]
        ↓  user controls + visualization
[Self-Healing Engine — executes safe fixes]
```

---

## 📂 Project Structure

```
autohealx/
 ├── agent/                    ← Node.js monitoring agent
 │    ├── index.js             ← Main orchestrator loop
 │    ├── monitor.js           ← CPU/memory/process reader
 │    ├── detector.js          ← Issue detection engine
 │    ├── healer.js            ← Self-healing action executor
 │    ├── knowledgeBase.js     ← Learning from past fixes
 │    ├── firebase.js          ← Firestore write functions
 │    └── package.json
 │
 ├── dashboard/                ← React web dashboard
 │    ├── src/
 │    │    ├── App.jsx          ← Main app + tabs
 │    │    ├── App.css          ← Dark cyberpunk theme
 │    │    ├── firebase.js      ← Firebase client setup
 │    │    ├── components/
 │    │    │    ├── CPUGraph.jsx
 │    │    │    ├── AlertPanel.jsx
 │    │    │    ├── FixHistory.jsx
 │    │    │    ├── KnowledgePanel.jsx
 │    │    │    └── ProcessTable.jsx
 │    │    └── hooks/
 │    │         └── useFirestore.js  ← Real-time listeners
 │    └── package.json
 │
 ├── config/
 │    ├── firebaseConfig.js     ← Firebase credentials template
 │    └── firestore.rules       ← Firestore security rules
 │
 └── scripts/
      ├── killProcess.sh
      ├── restartApp.sh
      └── clearCache.sh
```

---

## ⚙️ Setup Guide (Step-by-Step)

### Step 1: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (e.g., `autohealx`)
3. Enable **Firestore Database** (start in test mode)
4. Go to **Project Settings → Service Accounts**
5. Click **"Generate new private key"** → download JSON
6. Save it as `autohealx/config/serviceAccountKey.json`
7. Go to **Project Settings → General → Your Apps**
8. Add a Web App → copy the config object

### Step 2: Configure Firebase

**Agent config** (`autohealx/config/serviceAccountKey.json`):
- Already placed from Step 1

**Dashboard config** (`autohealx/dashboard/src/firebase.js`):
```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 3: Install & Run the Agent

```bash
cd autohealx/agent
npm install
cp .env.example .env

# Edit .env: set HEAL_MODE=suggestion (safe) or HEAL_MODE=auto
node index.js
```

You should see:
```
╔══════════════════════════════════════════╗
║        AutoHealX Agent v1.0.0           ║
║  Self-Healing System Monitoring Agent   ║
╚══════════════════════════════════════════╝
  Mode: SUGGESTION
  Starting...

✅ AutoHealX Agent is running.
```

### Step 4: Install & Run the Dashboard

```bash
cd autohealx/dashboard
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Healing Modes

| Mode | Behavior |
|------|----------|
| `suggestion` (default) | Detects issues, logs suggested fix, waits for user approval |
| `auto` | Automatically executes fixes within safe boundaries |

Change in `autohealx/agent/.env`:
```
HEAL_MODE=auto
```

---

## 🎯 Detection Rules

| Issue | Trigger | Action |
|-------|---------|--------|
| HIGH_CPU | CPU > 90% | Kill top CPU process |
| HIGH_CPU_WARNING | CPU > 75% | Monitor |
| SUSTAINED_HIGH_CPU | CPU > 70% for 3+ cycles | Reduce load |
| MEMORY_OVERLOAD | Memory > 88% | Kill top memory process |
| MEMORY_WARNING | Memory > 75% | Clear cache |
| MEMORY_LEAK_SUSPECTED | Memory consistently rising | Monitor |
| TOO_MANY_PROCESSES | > 500 processes | Review processes |

---

## 🛡️ Security Design

AutoHealX operates within **strict security boundaries**:

✅ **Allowed actions:**
- Kill high-resource processes (non-system)
- Clear system cache
- Monitor and log

❌ **Never allowed:**
- Access personal files or documents
- Modify system settings or registry
- Run arbitrary commands
- Access network or passwords

**Protected processes** (never killed): `systemd`, `init`, `sshd`, `login`, `bash`, `explorer`, `csrss`, `lsass`, and others.

---

## 📊 Dashboard Features

| Tab | Content |
|-----|---------|
| Dashboard | Stat cards + live CPU/Memory graph + recent alerts & fixes |
| Alerts | Full alert list with severity, confidence score, suggested action |
| Fix History | All healing actions with success/fail status and audit trail |
| Knowledge | Learned patterns with success rates per issue type |
| Processes | Live top-10 process table sorted by CPU usage |

---

## 🌐 Tamil Language Support

Switch to Tamil UI by clicking **"தமிழ்"** in the top-right header. All navigation labels switch to Tamil — a major advantage for judges!

---

## 🔥 Advanced Features

- **Trend Analysis** — Detects memory leaks from rising trends over time
- **Confidence Scores** — Every alert shows detection confidence %
- **Knowledge Base** — Tracks fix success rates, learns best action per issue type
- **Debouncing** — Same issue only re-alerts after 30 seconds (prevents spam)
- **Agent Heartbeat** — Dashboard shows agent online/offline status live
- **Audit Logs** — Every action is permanently logged in Firestore

---

## 🎬 Demo Script (For Presentation)

1. Start agent: `node autohealx/agent/index.js`
2. Open dashboard: `npm start` in `autohealx/dashboard/`
3. Show the **live CPU/Memory graph** updating every 3 seconds
4. Simulate high CPU: open multiple browser tabs / run a heavy task
5. Watch the **Alert panel** detect `HIGH_CPU`
6. See the **Fix History** log the suggested/auto action
7. Show the **Knowledge Base** learning from the fix
8. Toggle **Tamil language** to impress judges

**Winning line:**
> *"AutoHealX reduces system downtime by intelligently detecting and resolving failures in real-time using a secure, permission-based automation system — no human intervention required."*

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Agent | Node.js + `systeminformation` + `firebase-admin` |
| Database | Firebase Firestore (real-time sync) |
| Frontend | React 18 + Recharts + Tailwind concepts |
| Styling | CSS Variables + Dark theme + JetBrains Mono |
| Scripts | Bash (Linux/Mac) / taskkill (Windows) |

---

## 🚀 Production Tips

- Add Firebase Authentication to lock down Firestore
- Deploy dashboard to Firebase Hosting: `firebase deploy`
- Package agent as a system service with `pm2` or `systemd`
- Add email/SMS alerts via Firebase Functions + Twilio

---

*Built for hackathon victory. AutoHealX v1.0.0*
