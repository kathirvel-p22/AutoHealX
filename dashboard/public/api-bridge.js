// ============================================================
// AutoHealX — API Bridge for Agent-Dashboard Communication
// Handles localStorage-based communication between agent and dashboard
// ============================================================

class AutoHealXBridge {
  constructor() {
    this.listeners = new Map();
    this.setupStorageListener();
  }

  /**
   * Setup storage event listener for cross-tab communication
   */
  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      const listeners = this.listeners.get(e.key);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            const data = e.newValue ? JSON.parse(e.newValue) : null;
            callback(data, e.oldValue);
          } catch (error) {
            console.warn('Failed to parse storage data:', error);
          }
        });
      }
    });
  }

  /**
   * Subscribe to storage changes
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Get data from localStorage
   */
  getData(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.warn(`Failed to get data for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Set data to localStorage
   */
  setData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Failed to set data for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Update agent configuration
   */
  updateAgentConfig(config) {
    const configWithTimestamp = {
      ...config,
      timestamp: Date.now()
    };
    
    // Write to localStorage for immediate access
    this.setData('autohealx_agentConfig', configWithTimestamp);
    
    // Also try to write to a file the agent can read
    try {
      // Create a download link to save the config file
      const blob = new Blob([JSON.stringify(configWithTimestamp, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // For development, we'll use a different approach
      // Let's use a simple HTTP request to save the file
      fetch('/save-agent-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configWithTimestamp)
      }).catch(() => {
        console.warn('Could not save config via server, agent will need to check localStorage');
      });
      
    } catch (error) {
      console.warn('Could not create config file:', error);
    }
    
    return true;
  }

  /**
   * Send action approval signal
   */
  approveAction(actionId, reasoning = '') {
    return this.setData('autohealx_actionSignal', {
      actionId,
      type: 'approve',
      reasoning,
      timestamp: Date.now()
    });
  }

  /**
   * Send action rejection signal
   */
  rejectAction(actionId, reasoning = '') {
    return this.setData('autohealx_actionSignal', {
      actionId,
      type: 'reject',
      reasoning,
      timestamp: Date.now()
    });
  }

  /**
   * Get pending actions
   */
  getPendingActions() {
    return this.getData('autohealx_pendingActions', [])
      .filter(action => action.status === 'pending');
  }

  /**
   * Get agent status
   */
  getAgentStatus() {
    return this.getData('autohealx_agentStatus', null);
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return this.getData('autohealx_metrics', []);
  }

  /**
   * Get alerts
   */
  getAlerts() {
    return this.getData('autohealx_alerts', []);
  }

  /**
   * Get fix logs
   */
  getFixLogs() {
    return this.getData('autohealx_fixlogs', []);
  }

  /**
   * Get knowledge base
   */
  getKnowledge() {
    return this.getData('autohealx_knowledge', []);
  }

  /**
   * Clear all data (for testing)
   */
  clearAllData() {
    const keys = [
      'autohealx_metrics',
      'autohealx_alerts', 
      'autohealx_fixlogs',
      'autohealx_agentStatus',
      'autohealx_knowledge',
      'autohealx_pendingActions',
      'autohealx_actionSignal',
      'autohealx_agentConfig'
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log('AutoHealX: All data cleared');
  }

  /**
   * Simulate high CPU for testing
   */
  simulateHighCPU() {
    const fakeMetrics = {
      cpu: 95,
      memory: 45,
      processCount: 234,
      topCPUProcess: { name: 'chrome.exe', cpu: 78 },
      timestamp: Date.now()
    };

    // Add to metrics
    const metrics = this.getMetrics();
    metrics.push(fakeMetrics);
    this.setData('autohealx_metrics', metrics.slice(-50));

    // Create fake alert
    const alerts = this.getAlerts();
    alerts.unshift({
      id: `alert_${Date.now()}`,
      type: 'HIGH_CPU',
      severity: 'critical',
      message: 'Chrome consuming 78% CPU',
      value: 95,
      threshold: 90,
      confidence: 92,
      suggestedAction: 'Terminate chrome.exe',
      timestamp: new Date().toISOString(),
      resolved: false
    });
    this.setData('autohealx_alerts', alerts.slice(0, 20));

    // Create pending action
    const pendingActions = this.getPendingActions();
    pendingActions.push({
      id: `action_${Date.now()}`,
      type: 'HIGH_CPU',
      severity: 'critical',
      currentValue: 95,
      threshold: 90,
      confidence: 92,
      cause: 'Chrome consuming 78% CPU',
      process: 'chrome.exe',
      suggestedAction: 'Terminate chrome.exe process',
      reason: 'High CPU usage detected, terminating top consumer will stabilize system',
      expectedResult: 'CPU usage will reduce to ~17%, system responsiveness will improve',
      impact: 'Slow system response, potential application hangs',
      successRate: 89,
      status: 'pending',
      timestamp: Date.now()
    });
    this.setData('autohealx_pendingActions', pendingActions);

    console.log('AutoHealX: Simulated high CPU scenario');
  }
}

// Make bridge available globally
window.AutoHealXBridge = new AutoHealXBridge();

// Development helpers
if (window.location.hostname === 'localhost') {
  window.ahx = {
    bridge: window.AutoHealXBridge,
    clear: () => window.AutoHealXBridge.clearAllData(),
    simulate: () => window.AutoHealXBridge.simulateHighCPU(),
    status: () => console.log('Agent Status:', window.AutoHealXBridge.getAgentStatus()),
    pending: () => console.log('Pending Actions:', window.AutoHealXBridge.getPendingActions())
  };
  
  console.log('AutoHealX Bridge loaded. Try: ahx.simulate(), ahx.status(), ahx.clear()');
}