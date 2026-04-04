// ============================================================
// AutoHealX — Sample Data Generator for Testing
// ============================================================

function generateSampleMetrics() {
  const metrics = [];
  const now = Date.now();
  
  // Generate 30 data points over the last 5 minutes
  for (let i = 29; i >= 0; i--) {
    const timestamp = now - (i * 10000); // 10 second intervals
    const time = i * 10;
    
    // Generate realistic CPU and memory data with some variation
    const baseCpu = 25 + Math.sin(time / 50) * 15 + Math.random() * 10;
    const baseMemory = 45 + Math.cos(time / 30) * 10 + Math.random() * 8;
    
    // Add some spikes occasionally
    const cpuSpike = Math.random() < 0.1 ? Math.random() * 30 : 0;
    const memorySpike = Math.random() < 0.08 ? Math.random() * 20 : 0;
    
    const cpu = Math.min(100, Math.max(0, baseCpu + cpuSpike));
    const memory = Math.min(100, Math.max(0, baseMemory + memorySpike));
    
    metrics.push({
      timestamp,
      cpu: Math.round(cpu * 10) / 10,
      memory: Math.round(memory * 10) / 10,
      processCount: 180 + Math.floor(Math.random() * 40),
      topProcesses: [
        {
          name: 'chrome.exe',
          pid: 1234,
          cpu: Math.round((cpu * 0.4 + Math.random() * 10) * 10) / 10
        },
        {
          name: 'firefox.exe',
          pid: 2496,
          cpu: Math.round((cpu * 0.2 + Math.random() * 8) * 10) / 10
        },
        {
          name: 'code.exe',
          pid: 3456,
          cpu: Math.round((cpu * 0.15 + Math.random() * 6) * 10) / 10
        },
        {
          name: 'node.exe',
          pid: 4567,
          cpu: Math.round((cpu * 0.1 + Math.random() * 4) * 10) / 10
        },
        {
          name: 'explorer.exe',
          pid: 5678,
          cpu: Math.round((cpu * 0.05 + Math.random() * 2) * 10) / 10
        }
      ]
    });
  }
  
  return metrics;
}

function generateSampleAlerts() {
  return [
    {
      id: 'alert_1',
      type: 'HIGH_CPU',
      severity: 'warning',
      message: 'Chrome consuming high CPU resources',
      value: 78,
      threshold: 75,
      confidence: 89,
      suggestedAction: 'Monitor chrome.exe process',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      resolved: false
    },
    {
      id: 'alert_2',
      type: 'MEMORY_WARNING',
      severity: 'warning',
      message: 'Memory usage approaching threshold',
      value: 82,
      threshold: 75,
      confidence: 76,
      suggestedAction: 'Clear system cache',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      resolved: true
    }
  ];
}

function generateSampleFixLogs() {
  return [
    {
      id: 'fix_1',
      issueType: 'HIGH_CPU',
      severity: 'warning',
      action: 'monitor',
      mode: 'suggestion',
      success: true,
      skipped: false,
      message: 'Successfully monitored high CPU process',
      confidence: 89,
      processName: 'chrome.exe',
      timestamp: new Date(Date.now() - 180000).toISOString()
    }
  ];
}

// Initialize sample data
function initializeSampleData() {
  // Only add sample data if no real data exists AND agent is offline
  const agentStatus = localStorage.getItem('autohealx_agentStatus');
  const hasRealData = localStorage.getItem('autohealx_metrics');
  
  // Only use sample data if agent is offline and no real data exists
  if (!agentStatus && !hasRealData) {
    localStorage.setItem('autohealx_metrics', JSON.stringify(generateSampleMetrics()));
    localStorage.setItem('autohealx_alerts', JSON.stringify(generateSampleAlerts()));
    localStorage.setItem('autohealx_fixlogs', JSON.stringify(generateSampleFixLogs()));
    console.log('📊 Sample data initialized for AutoHealX dashboard (agent offline)');
  } else {
    console.log('🔄 Real agent data detected, skipping sample data');
  }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  initializeSampleData();
  
  // Add to global scope for manual testing
  window.AutoHealXSample = {
    generateMetrics: generateSampleMetrics,
    generateAlerts: generateSampleAlerts,
    generateFixLogs: generateSampleFixLogs,
    initialize: initializeSampleData
  };
}