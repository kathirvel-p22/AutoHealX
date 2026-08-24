// ============================================================
// AutoHealX — Bridge System for Agent-Dashboard Communication
// File-based communication bridge since Node.js doesn't have localStorage
// ============================================================

const fs = require('fs');
const path = require('path');

class BridgeSystem {
  constructor() {
    this.configDir = path.join(__dirname, '../config');
    this.dataDir = path.join(__dirname, '../data');
    this.ensureDirectories();
    this.watchers = new Map();
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    [this.configDir, this.dataDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Write data to bridge file
   */
  writeData(key, data) {
    try {
      const filePath = path.join(this.dataDir, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Failed to write bridge data for ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Read data from bridge file
   */
  readData(key, defaultValue = null) {
    try {
      const filePath = path.join(this.dataDir, `${key}.json`);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn(`Failed to read bridge data for ${key}:`, error.message);
    }
    return defaultValue;
  }

  /**
   * Watch for file changes (for dashboard signals)
   */
  watchFile(key, callback) {
    const filePath = path.join(this.dataDir, `${key}.json`);
    
    if (this.watchers.has(key)) {
      this.watchers.get(key).close();
    }

    try {
      const watcher = fs.watchFile(filePath, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime > prev.mtime) {
          const data = this.readData(key);
          if (data) {
            callback(data);
          }
        }
      });
      
      this.watchers.set(key, watcher);
      console.log(`👁️  Watching for changes: ${key}`);
    } catch (error) {
      console.warn(`Failed to watch file ${key}:`, error.message);
    }
  }

  /**
   * Stop watching a file
   */
  stopWatching(key) {
    if (this.watchers.has(key)) {
      fs.unwatchFile(path.join(this.dataDir, `${key}.json`));
      this.watchers.delete(key);
    }
  }

  /**
   * Stop all watchers
   */
  stopAllWatchers() {
    this.watchers.forEach((watcher, key) => {
      this.stopWatching(key);
    });
  }

  /**
   * Write metrics data
   */
  writeMetrics(metrics) {
    const existing = this.readData('metrics', []);
    existing.push(metrics);
    
    // Keep only last 100 metrics
    const trimmed = existing.slice(-100);
    return this.writeData('metrics', trimmed);
  }

  /**
   * Write alert data
   */
  writeAlert(alert) {
    const existing = this.readData('alerts', []);
    existing.unshift(alert); // Add to beginning
    
    // Keep only last 50 alerts
    const trimmed = existing.slice(0, 50);
    return this.writeData('alerts', trimmed);
  }

  /**
   * Write fix log
   */
  writeFixLog(fixLog) {
    const existing = this.readData('fixlogs', []);
    existing.unshift(fixLog); // Add to beginning
    
    // Keep only last 50 fix logs
    const trimmed = existing.slice(0, 50);
    return this.writeData('fixlogs', trimmed);
  }

  /**
   * Write agent status
   */
  writeAgentStatus(status) {
    return this.writeData('agentStatus', {
      ...status,
      lastUpdate: Date.now()
    });
  }

  /**
   * Write knowledge base
   */
  writeKnowledge(knowledge) {
    return this.writeData('knowledge', knowledge);
  }

  /**
   * Write pending actions
   */
  writePendingActions(actions) {
    return this.writeData('pendingActions', actions);
  }

  /**
   * Check for action signals from dashboard
   */
  checkActionSignal(actionId) {
    const signal = this.readData('actionSignal');
    if (signal && signal.actionId === actionId) {
      // Clear the signal after reading
      this.writeData('actionSignal', null);
      return signal;
    }
    return null;
  }

  /**
   * Check for config updates from dashboard
   */
  checkConfigUpdate() {
    return this.readData('agentConfig');
  }

  /**
   * Copy data to dashboard public folder for web access
   */
  syncToDashboard() {
    const dashboardDataDir = path.join(__dirname, '../dashboard/public/data');
    
    try {
      if (!fs.existsSync(dashboardDataDir)) {
        fs.mkdirSync(dashboardDataDir, { recursive: true });
      }

      // Copy all data files
      const dataFiles = fs.readdirSync(this.dataDir);
      dataFiles.forEach(file => {
        if (file.endsWith('.json')) {
          const srcPath = path.join(this.dataDir, file);
          const destPath = path.join(dashboardDataDir, file);
          fs.copyFileSync(srcPath, destPath);
        }
      });
      
      return true;
    } catch (error) {
      console.warn('Failed to sync data to dashboard:', error.message);
      return false;
    }
  }
}

module.exports = new BridgeSystem();