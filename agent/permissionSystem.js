// ============================================================
// AutoHealX — Permission & Approval System
// Handles user permissions and action approvals
// ============================================================

const fs = require('fs');
const path = require('path');

class PermissionSystem {
  constructor() {
    this.configPath = path.join(__dirname, '../config/localData.json');
    this.pendingActions = [];
    this.config = this.loadConfig();
  }

  /**
   * Load user configuration
   */
  loadConfig() {
    try {
      // First try the main config file
      if (fs.existsSync(this.configPath)) {
        const data = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        if (data.userConfig) {
          return data.userConfig;
        }
      }
      
      // Fallback to separate user config file
      const userConfigPath = path.join(__dirname, '../config/userConfig.json');
      if (fs.existsSync(userConfigPath)) {
        const userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
        console.log('📝 Loaded user config:', userConfig);
        return userConfig;
      }
    } catch (error) {
      console.warn('Failed to load config:', error.message);
    }
    
    return { mode: 'suggestion', monitoring: false };
  }

  /**
   * Save user configuration
   */
  saveConfig(config) {
    try {
      let data = {};
      if (fs.existsSync(this.configPath)) {
        data = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
      
      data.userConfig = config;
      fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
      this.config = config;
      
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      return false;
    }
  }

  /**
   * Check if monitoring is enabled
   */
  isMonitoringEnabled() {
    return this.config.monitoring === true;
  }

  /**
   * Get current mode (suggestion/auto)
   */
  getMode() {
    return this.config.mode || 'suggestion';
  }

  /**
   * Request permission for an action
   */
  async requestPermission(issue) {
    const mode = this.getMode();
    
    if (mode === 'auto') {
      // Auto mode - check if action is safe
      if (this.isSafeAction(issue)) {
        console.log(`🤖 AUTO MODE: Executing ${issue.type} automatically`);
        return { approved: true, mode: 'auto' };
      } else {
        console.log(`⚠️  AUTO MODE: Action ${issue.type} requires manual approval (safety check failed)`);
        return await this.requestManualApproval(issue);
      }
    } else {
      // Suggestion mode - always ask for approval
      console.log(`👤 SUGGESTION MODE: Requesting approval for ${issue.type}`);
      return await this.requestManualApproval(issue);
    }
  }

  /**
   * Check if action is safe for auto execution
   */
  isSafeAction(issue) {
    // Define safe actions that can be auto-executed
    const safeActions = [
      'HIGH_CPU',
      'HIGH_MEMORY', 
      'MEMORY_OVERLOAD'
    ];

    // Additional safety checks
    const isSafeType = safeActions.includes(issue.type);
    const hasHighConfidence = issue.confidence >= 80;
    const hasGoodSuccessRate = !issue.successRate || issue.successRate >= 70;
    const isNotSystemProcess = !this.isSystemProcess(issue.process);

    return isSafeType && hasHighConfidence && hasGoodSuccessRate && isNotSystemProcess;
  }

  /**
   * Check if process is a system process (never kill these)
   */
  isSystemProcess(processName) {
    if (!processName) return false;
    
    const systemProcesses = [
      'systemd', 'init', 'kernel', 'kthreadd', 'ksoftirqd',
      'migration', 'rcu_', 'watchdog', 'sshd', 'login', 'bash',
      'explorer.exe', 'winlogon.exe', 'csrss.exe', 'lsass.exe',
      'services.exe', 'spoolsv.exe', 'dwm.exe', 'audiodg.exe'
    ];

    const lowerName = processName.toLowerCase();
    return systemProcesses.some(sys => lowerName.includes(sys.toLowerCase()));
  }

  /**
   * Request manual approval from user
   */
  async requestManualApproval(issue) {
    // Store pending action
    this.addPendingAction(issue);
    
    // Wait for user response
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║  🚨 USER APPROVAL REQUIRED               ║`);
    console.log(`╚══════════════════════════════════════════╝`);
    console.log(`Issue: ${issue.type}`);
    console.log(`Severity: ${issue.severity?.toUpperCase()}`);
    console.log(`Current Value: ${issue.currentValue}%`);
    console.log(`Cause: ${issue.cause}`);
    console.log(`Suggested Action: ${issue.suggestedAction}`);
    console.log(`Reason: ${issue.reason}`);
    console.log(`Confidence: ${issue.confidence}%`);
    if (issue.successRate) {
      console.log(`Success Rate: ${issue.successRate}%`);
    }
    console.log(`\n👉 Please check the dashboard to approve or reject this action.`);
    console.log(`   Dashboard URL: http://localhost:3000`);
    
    // Poll for user response
    return await this.waitForUserResponse(issue.id);
  }

  /**
   * Add pending action to storage
   */
  addPendingAction(issue) {
    this.pendingActions.push(issue);
    
    // Save to file for dashboard to read (Node.js doesn't have localStorage)
    try {
      const configDir = path.join(__dirname, '../config');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      const filePath = path.join(configDir, 'pendingActions.json');
      fs.writeFileSync(filePath, JSON.stringify(this.pendingActions, null, 2));
      
      console.log(`📝 Pending action saved: ${issue.id}`);
    } catch (error) {
      console.warn('Failed to save pending actions:', error.message);
    }
  }

  /**
   * Wait for user response (polling) - Non-blocking
   */
  async waitForUserResponse(actionId, timeout = 300000) { // 5 minutes timeout
    const startTime = Date.now();
    const pollInterval = 2000; // Check every 2 seconds
    
    return new Promise((resolve) => {
      const poll = () => {
        // Check if timeout exceeded
        if (Date.now() - startTime > timeout) {
          console.log(`⏰ Timeout: No response received for ${actionId}`);
          resolve({ approved: false, reason: 'timeout' });
          return;
        }

        // Check for response in file system
        try {
          const signalPath = path.join(__dirname, '../config/actionSignal.json');
          if (fs.existsSync(signalPath)) {
            const signalData = JSON.parse(fs.readFileSync(signalPath, 'utf8'));
            if (signalData.actionId === actionId) {
              fs.unlinkSync(signalPath); // Remove signal file
              
              const approved = signalData.type === 'approve';
              console.log(`✅ User response: ${approved ? 'APPROVED' : 'REJECTED'}`);
              
              resolve({ 
                approved, 
                reason: approved ? 'user_approved' : 'user_rejected' 
              });
              return;
            }
          }
        } catch (error) {
          // Continue polling on error
        }

        // Continue polling
        setTimeout(poll, pollInterval);
      };

      // Start polling immediately but don't block
      setTimeout(poll, 100);
    });
  }

  /**
   * Update configuration from dashboard
   */
  updateConfig(newConfig) {
    console.log(`📝 Updating configuration:`, newConfig);
    return this.saveConfig(newConfig);
  }

  /**
   * Get current status for dashboard
   */
  getStatus() {
    return {
      monitoring: this.isMonitoringEnabled(),
      mode: this.getMode(),
      pendingActions: this.pendingActions.length,
      lastUpdate: Date.now()
    };
  }

  /**
   * Check for config updates from dashboard - Professional approach
   */
  checkForConfigUpdates() {
    try {
      // Check for config file from dashboard first
      const dashboardConfigPath = path.join(__dirname, '../dashboard/public/agent-config.json');
      if (fs.existsSync(dashboardConfigPath)) {
        const dashboardConfig = JSON.parse(fs.readFileSync(dashboardConfigPath, 'utf8'));
        
        // If timestamp is newer, update our config
        if (dashboardConfig.timestamp > (this.config.timestamp || 0)) {
          console.log('📝 Received config update from dashboard file:', dashboardConfig);
          this.config = { ...dashboardConfig };
          this.saveConfig(this.config);
          
          // Remove the dashboard config file after processing
          fs.unlinkSync(dashboardConfigPath);
          
          return true;
        }
      }
      
      // Check for config signal file (backup method)
      const configSignalPath = path.join(__dirname, '../config/configSignal.json');
      if (fs.existsSync(configSignalPath)) {
        const signal = JSON.parse(fs.readFileSync(configSignalPath, 'utf8'));
        
        // If timestamp is newer, update our config
        if (signal.timestamp > (this.config.timestamp || 0)) {
          console.log('📝 Received config update from signal file:', signal.config);
          this.config = { ...signal.config };
          this.saveConfig(this.config);
          
          // Remove the signal file after processing
          fs.unlinkSync(configSignalPath);
          
          return true;
        }
      }
      
      // Check user config file for direct updates
      const userConfigPath = path.join(__dirname, '../config/userConfig.json');
      if (fs.existsSync(userConfigPath)) {
        const userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
        
        // If timestamp is newer, update our config
        if (userConfig.timestamp > (this.config.timestamp || 0)) {
          console.log('📝 Received direct config update:', userConfig);
          this.config = { ...userConfig };
          this.saveConfig(this.config);
          
          return true;
        }
      }
    } catch (error) {
      // Silently handle errors to avoid spam
      if (error.message.includes('ENOENT') === false) {
        console.warn('Config update check failed:', error.message);
      }
    }
    
    return false;
  }
}

module.exports = new PermissionSystem();