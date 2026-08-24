// ============================================================
// AutoHealX — Dashboard API Server
// Simple Express server to handle agent-dashboard communication
// ============================================================

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Data directory paths
const AGENT_DATA_DIR = path.join(__dirname, '../data');
const DASHBOARD_DATA_DIR = path.join(__dirname, 'public/data');

// Ensure directories exist
[AGENT_DATA_DIR, DASHBOARD_DATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * API endpoint to handle action signals from dashboard
 */
app.post('/api/action-signal', (req, res) => {
  try {
    const signal = req.body;
    
    // Write signal to agent data directory
    const signalPath = path.join(AGENT_DATA_DIR, 'actionSignal.json');
    fs.writeFileSync(signalPath, JSON.stringify(signal, null, 2));
    
    console.log(`📡 Action signal sent: ${signal.type} for ${signal.actionId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to write action signal:', error);
    res.status(500).json({ error: 'Failed to send signal' });
  }
});

/**
 * API endpoint to handle kill process requests from dashboard
 */
app.post('/api/kill-process', (req, res) => {
  try {
    const killRequest = req.body;
    
    // Write kill request to agent config directory for immediate processing
    const killRequestPath = path.join(__dirname, '../config/killRequest.json');
    fs.writeFileSync(killRequestPath, JSON.stringify(killRequest, null, 2));
    
    console.log(`🗑️ Kill process request: ${killRequest.name} (PID: ${killRequest.pid})`);
    res.json({ success: true, message: `Kill request sent for ${killRequest.name}` });
  } catch (error) {
    console.error('Failed to write kill request:', error);
    res.status(500).json({ error: 'Failed to send kill request' });
  }
});

/**
 * API endpoint to handle agent config updates
 */
app.post('/api/agent-config', (req, res) => {
  try {
    const config = req.body;
    
    // Write config to agent data directory
    const configPath = path.join(AGENT_DATA_DIR, 'agentConfig.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log(`⚙️  Agent config updated:`, config);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to write agent config:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

/**
 * API endpoint to get data files
 */
app.get('/api/data/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(DASHBOARD_DATA_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      res.json(data);
    } else {
      res.status(404).json({ error: 'Data file not found' });
    }
  } catch (error) {
    console.error('Failed to read data file:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

/**
 * Sync data from agent to dashboard (periodic)
 */
function syncDataFromAgent() {
  try {
    if (fs.existsSync(AGENT_DATA_DIR)) {
      const files = fs.readdirSync(AGENT_DATA_DIR);
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const srcPath = path.join(AGENT_DATA_DIR, file);
          const destPath = path.join(DASHBOARD_DATA_DIR, file);
          
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      });
    }
  } catch (error) {
    console.warn('Failed to sync data from agent:', error.message);
  }
}

// Sync data every 15 seconds to match agent cycles
setInterval(syncDataFromAgent, 15000);

// Development mode - just return a simple message for root
app.get('/', (req, res) => {
  res.json({ 
    message: 'AutoHealX API Server Running on port 3001', 
    note: 'React app should be running on port 3000',
    endpoints: ['/api/kill-process', '/api/agent-config', '/api/action-signal']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AutoHealX Dashboard API running on port ${PORT}`);
  console.log(`📁 Agent data directory: ${AGENT_DATA_DIR}`);
  console.log(`📁 Dashboard data directory: ${DASHBOARD_DATA_DIR}`);
  
  // Initial sync
  syncDataFromAgent();
});

module.exports = app;