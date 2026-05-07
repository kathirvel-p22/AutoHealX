# ⚡ AutoHealX KUBEMIND - Quick Start Guide

## 🚀 Get Running in 2 Minutes

### Prerequisites
- Node.js 18+ installed
- A web browser

---

## 📋 Step-by-Step Setup

### 1. Install Dependencies (30 seconds)
```bash
npm install
```

### 2. Configure Environment (30 seconds)
The `.env.local` file is already created. You can optionally add your Gemini API key:

```env
VITE_GEMINI_API_KEY=your-api-key-here
VITE_APP_URL=http://localhost:3000
```

**Note:** The platform works with mock AI data if no API key is provided!

### 3. Start the Server (10 seconds)
```bash
npm run dev
```

### 4. Open Browser (10 seconds)
Navigate to: **http://localhost:3000**

---

## 🎭 Demo Flow (7 Minutes)

### Login Credentials
**Default Admin Account:**
- Email: `admin@autohealx.io`
- Password: `admin123`

**Or create a new account:**
1. Click "Request Access"
2. Fill in the form
3. Use any role (they all work for demo)
4. Submit

---

### 🎯 The Perfect Demo Path

#### 1. **Dashboard** (30 seconds)
- Show system health metrics
- Point out MTTR, active incidents, cluster health
- Highlight service status grid with sparklines

#### 2. **Mission Control** ⭐ (2 minutes) - **START HERE FOR WOW FACTOR**
- Navigate to "Mission Control" in sidebar
- Show the full command center layout
- Point out each panel:
  - Top-left: Live topology
  - Top-right: Incident feed
  - Middle-right: AI reasoning chain
  - Bottom-left: Remediation queue
  - Bottom-middle: Predictions
  - Bottom-right: Agent activity

#### 3. **Simulate Incident** (1 minute)
- Click "Deep Scan" button in header
- Watch incident appear in real-time
- See AI agents activate
- Show reasoning chain populate

#### 4. **Topology** (1 minute)
- Navigate to "Topology" tab
- Show interactive graph
- Hover over services to see metrics
- Click a service to highlight dependencies
- Zoom in/out to demonstrate interactivity

#### 5. **Incidents** (1 minute)
- Navigate to "Incidents" tab
- Click on the simulated incident
- Show detailed analysis
- Point out AI-generated recommendations
- Highlight confidence scores

#### 6. **Audit Chain** (30 seconds)
- Navigate to "Audit Chain" tab
- Show cryptographic signatures
- Point out immutable logging
- Highlight user attribution

#### 7. **Closing** (30 seconds)
- Return to Mission Control
- Emphasize the full platform view
- Highlight autonomous intelligence

---

## 🎨 Key Features to Highlight

### Visual Wow Factors
1. ⭐⭐⭐ **Mission Control** - Full-screen command center
2. ⭐⭐⭐ **Live Topology** - Interactive infrastructure graph
3. ⭐⭐ **AI Reasoning Chain** - Multi-agent decision flow
4. ⭐⭐ **Real-time Updates** - Everything updates live
5. ⭐ **Professional Design** - Enterprise-grade aesthetics

### Technical Differentiators
1. **13 AI Agents** working in parallel
2. **Predictive Failure Analysis** - forecast before crash
3. **Autonomous Remediation** - self-healing with approval
4. **Real-time Topology** - live infrastructure intelligence
5. **Cryptographic Auditability** - enterprise governance

---

## 🎤 Talking Points

### Opening (15 seconds)
> "This is AutoHealX KUBEMIND - an AI-Driven Autonomous Infrastructure Intelligence Platform. Not monitoring, but intelligent operations."

### Mission Control (30 seconds)
> "This is our command center. Live topology shows 12 microservices. AI reasoning chain shows 13 agents analyzing in real-time. Remediation queue has AI-generated recovery actions. Predictions panel forecasts failures before they occur."

### Topology (20 seconds)
> "Interactive infrastructure map. Every node updates in real-time. Dependencies automatically discovered. Color-coded health status. Click to see the blast radius."

### AI Agents (30 seconds)
> "13 specialized agents: CPU, Network, Dependency, Correlation, RCA, Prediction, Recommendation, and more. They work like a team of expert engineers, analyzing in parallel, building consensus."

### Autonomous Remediation (30 seconds)
> "AI generates recovery actions with risk assessment. Low-risk actions can auto-execute. High-risk require human approval. Every action is cryptographically signed."

### Closing (15 seconds)
> "This is the future of infrastructure operations: Intelligent, Predictive, Autonomous, and Governed."

---

## 🚫 Common Issues & Solutions

### Issue: Server won't start
**Solution:** 
```bash
# Kill any process on port 3000
npx kill-port 3000
# Then restart
npm run dev
```

### Issue: Can't log in
**Solution:** 
- Use: `admin@autohealx.io` / `admin123`
- Or create a new account via "Request Access"

### Issue: Topology not loading
**Solution:** 
- Refresh the page
- The topology service auto-generates on first load

### Issue: AI analysis not working
**Solution:** 
- The platform uses mock data by default
- Add Gemini API key to `.env.local` for real AI
- Mock data is sufficient for demo purposes

---

## 📊 What Each Screen Shows

### Dashboard
- System health overview
- MTTR metrics
- Active incidents
- Service status grid

### Mission Control ⭐
- **Everything in one view**
- Live topology
- Incident feed
- AI reasoning
- Remediation queue
- Predictions
- Agent activity

### Topology
- Interactive service graph
- Dependency visualization
- Real-time metrics
- Health indicators

### Incidents
- Incident list
- Detailed analysis
- AI recommendations
- Approval workflow

### Actions
- Remediation queue
- Risk assessment
- Execution status

### Logs
- Real-time log stream
- Filtering
- Severity highlighting

### Audit Chain
- Immutable logs
- Cryptographic signatures
- Compliance reporting

### RBAC Users
- User management
- Role assignment
- Permission matrix

### Provisioning
- Enrollment requests
- Approval workflow
- PGP validation

---

## 🎯 Success Metrics

**You've nailed the demo if:**
- ✅ Judges say "This is impressive"
- ✅ They ask "How did you build this?"
- ✅ They want to know about the business model
- ✅ They ask "Can we try it?"

---

## 🔧 Troubleshooting Commands

```bash
# Check if server is running
curl http://localhost:3000/api/health

# View server logs
# (Check the terminal where you ran npm run dev)

# Restart server
# Ctrl+C to stop, then npm run dev

# Clear browser cache
# Ctrl+Shift+R (hard refresh)

# Check TypeScript errors
npm run lint

# Build for production
npm run build
```

---

## 📱 Browser Compatibility

**Recommended:**
- Chrome (latest)
- Edge (latest)
- Firefox (latest)

**Not Recommended:**
- Internet Explorer (not supported)
- Safari (may have animation issues)

---

## 🎬 Demo Checklist

**Before Starting:**
- [ ] Server is running (`npm run dev`)
- [ ] Browser is open to http://localhost:3000
- [ ] You're logged in as admin
- [ ] Browser is in full-screen mode (F11)
- [ ] No browser extensions visible
- [ ] Network is stable

**During Demo:**
- [ ] Start with Mission Control (wow factor)
- [ ] Simulate an incident
- [ ] Show topology interaction
- [ ] Highlight AI reasoning
- [ ] Demonstrate remediation
- [ ] End with audit chain

**After Demo:**
- [ ] Thank the judges
- [ ] Offer to answer questions
- [ ] Be ready to dive deeper

---

## 🏆 Key Differentiators

**What This is NOT:**
- ❌ A monitoring dashboard
- ❌ A chatbot
- ❌ A log viewer

**What This IS:**
- ✅ AI-driven autonomous intelligence
- ✅ Multi-agent orchestration
- ✅ Predictive failure analysis
- ✅ Self-healing operations
- ✅ Enterprise governance

---

## 📞 Quick Reference

**Server:** http://localhost:3000
**API Health:** http://localhost:3000/api/health
**Login:** admin@autohealx.io / admin123

**Key Screens:**
1. Mission Control (⭐⭐⭐)
2. Topology (⭐⭐⭐)
3. Incidents (⭐⭐)
4. Audit Chain (⭐)

**Demo Time:** 7 minutes
**Setup Time:** 2 minutes
**Wow Factor:** Maximum

---

## 🚀 You're Ready!

The platform is fully functional and demo-ready. Just follow this guide and you'll deliver an impressive presentation.

**Good luck! 🎯**

---

## 💡 Pro Tips

1. **Start with Mission Control** - It's the most impressive screen
2. **Let the visuals speak** - Don't over-explain
3. **Show, don't tell** - Click around, interact
4. **Emphasize AI agents** - 13 specialized agents is unique
5. **Highlight predictions** - Forecasting is a key differentiator
6. **End strong** - Return to Mission Control for final impact

---

**Remember:** You're not selling monitoring. You're demonstrating the future of autonomous infrastructure operations.
