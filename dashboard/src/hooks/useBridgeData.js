// ============================================================
// AutoHealX — Simplified Bridge Data Hook
// Direct file + localStorage communication between agent and dashboard
// ============================================================

import { useState, useEffect } from 'react';

/**
 * Hook for agent status with NO POLLING on login page
 * Only starts polling when user is authenticated
 */
export function useAgentStatus(isAuthenticated = true) {
  const [agentStatus, setAgentStatus] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(0);

  useEffect(() => {
    // COMPLETELY DISABLE polling if user is not authenticated
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated - NO POLLING (login page stable)');
      setAgentStatus(null);
      return;
    }

    console.log('🔐 User authenticated - Starting agent status polling...');
    let intervalId;

    const fetchAgentStatus = async () => {
      console.log(`[${new Date().toLocaleTimeString()}] 🔄 Fetching agent status...`);
      try {
        // Try to fetch from data directory first (primary path)
        let response = await fetch('/data/agentStatus.json?t=' + Date.now());
        if (!response.ok) {
          // Fallback to root agent-status.json
          response = await fetch('/agent-status.json?t=' + Date.now());
        }
        
        if (response.ok) {
          const status = await response.json();
          
          // Only update if data has actually changed
          if (status.timestamp !== lastUpdate) {
            // TRUST the agent's reported status, but add timestamp validation as backup
            let finalStatus = status.status || 'offline';
            
            // Only override if timestamp is VERY old (more than 2 minutes = definitely offline)
            if (status.timestamp && (Date.now() - status.timestamp) > 120000) {
              finalStatus = 'offline';
              console.log('⚠️ Agent timestamp very old, marking as offline');
            }
            
            const newStatus = { 
              ...status, 
              status: finalStatus,
              lastHeartbeat: status.lastHeartbeat || status.timestamp 
            };
            
            // Smooth update - only update if status actually changed
            setAgentStatus(prevStatus => {
              if (!prevStatus || 
                  prevStatus.status !== newStatus.status ||
                  prevStatus.mode !== newStatus.mode ||
                  prevStatus.cycleCount !== newStatus.cycleCount) {
                console.log('📊 Agent status updated:', newStatus.status, newStatus.mode);
                return newStatus;
              }
              return prevStatus;
            });
            
            setLastUpdate(status.timestamp);
          }
          return;
        }
      } catch (error) {
        // Fallback to localStorage
        console.warn('Failed to fetch agent status from file, trying localStorage');
      }

      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('autohealx_agentStatus');
        if (stored) {
          const status = JSON.parse(stored);
          
          // Only update if data has actually changed
          if (status.timestamp !== lastUpdate) {
            // TRUST the agent's reported status, but add timestamp validation as backup
            let finalStatus = status.status || 'offline';
            
            // Only override if timestamp is VERY old (more than 2 minutes = definitely offline)
            if (status.timestamp && (Date.now() - status.timestamp) > 120000) {
              finalStatus = 'offline';
              console.log('⚠️ Agent timestamp very old, marking as offline');
            }
            
            const newStatus = { 
              ...status, 
              status: finalStatus,
              lastHeartbeat: status.lastHeartbeat || status.timestamp 
            };
            
            setAgentStatus(prevStatus => {
              if (!prevStatus || 
                  prevStatus.status !== newStatus.status ||
                  prevStatus.mode !== newStatus.mode ||
                  prevStatus.cycleCount !== newStatus.cycleCount) {
                console.log('📊 Agent status updated from localStorage:', newStatus.status, newStatus.mode);
                return newStatus;
              }
              return prevStatus;
            });
            
            setLastUpdate(status.timestamp);
          }
        } else {
          setAgentStatus(null);
        }
      } catch (error) {
        console.warn('Failed to parse agent status from localStorage:', error);
        setAgentStatus(null);
      }
    };

    // Initial fetch
    fetchAgentStatus();

    // Set up smooth polling (every 15 seconds for professional feel)
    intervalId = setInterval(() => {
      console.log(`[${new Date().toLocaleTimeString()}] 🔄 15-second refresh cycle - Fetching agent status...`);
      fetchAgentStatus();
    }, 15000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [lastUpdate, isAuthenticated]); // Add isAuthenticated to dependencies

  return { agentStatus };
}

/**
 * Hook for metrics data with NO POLLING on login page
 */
export function useMetrics(limitCount = 50, isAuthenticated = true) {
  const [metrics, setMetrics] = useState([]);
  const [latest, setLatest] = useState(null);
  const [lastMetricTime, setLastMetricTime] = useState(0);

  useEffect(() => {
    // COMPLETELY DISABLE polling if user is not authenticated
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated - NO METRICS POLLING (login page stable)');
      setMetrics([]);
      setLatest(null);
      return;
    }

    console.log('🔐 User authenticated - Starting metrics polling...');
    let intervalId;

    const fetchMetrics = async () => {
      console.log(`[${new Date().toLocaleTimeString()}] 📊 Fetching metrics...`);
      try {
        // Try to fetch from public JSON file first
        const response = await fetch('/metrics.json?t=' + Date.now());
        if (response.ok) {
          const metricsData = await response.json();
          const processedMetrics = Array.isArray(metricsData) ? 
            metricsData.slice(-limitCount) : [];
          
          // Only update if we have new data
          const latestMetric = processedMetrics.length > 0 ? 
            processedMetrics[processedMetrics.length - 1] : null;
          
          if (latestMetric && latestMetric.timestamp !== lastMetricTime) {
            setMetrics(processedMetrics);
            setLatest(latestMetric);
            setLastMetricTime(latestMetric.timestamp);
          }
          return;
        }
      } catch (error) {
        console.warn('Failed to fetch metrics from file, trying localStorage');
      }

      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('autohealx_metrics');
        if (stored) {
          const metricsData = JSON.parse(stored);
          const processedMetrics = Array.isArray(metricsData) ? 
            metricsData.slice(-limitCount) : [];
          
          // Only update if we have new data
          const latestMetric = processedMetrics.length > 0 ? 
            processedMetrics[processedMetrics.length - 1] : null;
          
          if (latestMetric && latestMetric.timestamp !== lastMetricTime) {
            setMetrics(processedMetrics);
            setLatest(latestMetric);
            setLastMetricTime(latestMetric.timestamp);
          }
        } else {
          setMetrics([]);
          setLatest(null);
        }
      } catch (error) {
        console.warn('Failed to parse metrics from localStorage:', error);
        setMetrics([]);
        setLatest(null);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up smooth polling (every 15 seconds for professional feel)
    intervalId = setInterval(() => {
      console.log(`[${new Date().toLocaleTimeString()}] 📊 15-second refresh cycle - Fetching metrics...`);
      fetchMetrics();
    }, 15000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [limitCount, lastMetricTime, isAuthenticated]); // Add isAuthenticated to dependencies

  return { metrics, latest };
}

/**
 * Hook for alerts data
 */
export function useAlerts(limitCount = 20, isAuthenticated = true) {
  const [alerts, setAlerts] = useState([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);

  useEffect(() => {
    // Don't start polling if user is not authenticated
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated - skipping alerts polling');
      return;
    }

    const fetchAlerts = () => {
      try {
        const stored = localStorage.getItem('autohealx_alerts');
        if (stored) {
          const alertsData = JSON.parse(stored);
          const processedAlerts = Array.isArray(alertsData) ? alertsData.slice(0, limitCount) : [];
          setAlerts(processedAlerts);
          setUnresolvedCount(Array.isArray(alertsData) ? alertsData.filter(a => !a.resolved).length : 0);
        } else {
          setAlerts([]);
          setUnresolvedCount(0);
        }
      } catch (error) {
        console.warn('Failed to parse alerts from localStorage:', error);
        setAlerts([]);
        setUnresolvedCount(0);
      }
    };

    // Initial fetch
    fetchAlerts();

    // Set up polling (every 15 seconds)
    const intervalId = setInterval(fetchAlerts, 15000);

    return () => clearInterval(intervalId);
  }, [limitCount, isAuthenticated]); // Add isAuthenticated to dependencies

  return { alerts, unresolvedCount };
}

/**
 * Hook for fix logs data
 * Only starts polling when user is authenticated
 */
export function useFixLogs(limitCount = 20, isAuthenticated = true) {
  const [fixLogs, setFixLogs] = useState([]);

  useEffect(() => {
    // Don't start polling if user is not authenticated
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated - skipping fix logs polling');
      return;
    }

    const fetchFixLogs = () => {
      try {
        const stored = localStorage.getItem('autohealx_fixlogs');
        if (stored) {
          const fixLogsData = JSON.parse(stored);
          setFixLogs(Array.isArray(fixLogsData) ? fixLogsData.slice(0, limitCount) : []);
        } else {
          setFixLogs([]);
        }
      } catch (error) {
        console.warn('Failed to parse fix logs from localStorage:', error);
        setFixLogs([]);
      }
    };

    // Initial fetch
    fetchFixLogs();

    // Set up polling (every 15 seconds)
    const intervalId = setInterval(fetchFixLogs, 15000);

    return () => clearInterval(intervalId);
  }, [limitCount, isAuthenticated]); // Add isAuthenticated to dependencies

  return { fixLogs };
}

/**
 * Hook for knowledge base
 * Only starts polling when user is authenticated
 */
export function useKnowledge(isAuthenticated = true) {
  const [knowledge, setKnowledge] = useState([]);

  useEffect(() => {
    // Don't start polling if user is not authenticated
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated - skipping knowledge polling');
      return;
    }
    const fetchKnowledge = () => {
      try {
        const stored = localStorage.getItem('autohealx_knowledge');
        if (stored) {
          const knowledgeData = JSON.parse(stored);
          setKnowledge(Array.isArray(knowledgeData) ? knowledgeData : []);
        } else {
          setKnowledge([]);
        }
      } catch (error) {
        console.warn('Failed to parse knowledge from localStorage:', error);
        setKnowledge([]);
      }
    };

    // Initial fetch
    fetchKnowledge();

    // Set up polling (every 15 seconds)
    const intervalId = setInterval(fetchKnowledge, 15000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]); // Add isAuthenticated to dependencies

  return { knowledge };
}

/**
 * Hook for pending actions
 * Only starts polling when user is authenticated
 */
export function usePendingActions(isAuthenticated = true) {
  const [pendingActions, setPendingActions] = useState([]);

  useEffect(() => {
    // Don't start polling if user is not authenticated
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated - skipping pending actions polling');
      return;
    }
    const fetchPendingActions = () => {
      try {
        const stored = localStorage.getItem('autohealx_pendingActions');
        if (stored) {
          const actionsData = JSON.parse(stored);
          const activePending = Array.isArray(actionsData) ? 
            actionsData.filter(action => action.status === 'pending') : [];
          setPendingActions(activePending);
        } else {
          setPendingActions([]);
        }
      } catch (error) {
        console.warn('Failed to parse pending actions from localStorage:', error);
        setPendingActions([]);
      }
    };

    // Initial fetch
    fetchPendingActions();

    // Set up polling (every 15 seconds to match agent cycles)
    const intervalId = setInterval(fetchPendingActions, 15000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]); // Add isAuthenticated to dependencies

  return { pendingActions };
}

/**
 * Function to send action approval
 */
export async function approveAction(actionId, reasoning = '') {
  try {
    // Use the global bridge if available
    if (window.AutoHealXBridge) {
      return window.AutoHealXBridge.approveAction(actionId, reasoning);
    }
    
    // Fallback: write to localStorage
    localStorage.setItem('autohealx_actionSignal', JSON.stringify({
      actionId,
      type: 'approve',
      reasoning,
      timestamp: Date.now()
    }));
    
    return true;
  } catch (error) {
    console.error('Failed to approve action:', error);
    return false;
  }
}

/**
 * Function to send action rejection
 */
export async function rejectAction(actionId, reasoning = '') {
  try {
    // Use the global bridge if available
    if (window.AutoHealXBridge) {
      return window.AutoHealXBridge.rejectAction(actionId, reasoning);
    }
    
    // Fallback: write to localStorage
    localStorage.setItem('autohealx_actionSignal', JSON.stringify({
      actionId,
      type: 'reject',
      reasoning,
      timestamp: Date.now()
    }));
    
    return true;
  } catch (error) {
    console.error('Failed to reject action:', error);
    return false;
  }
}

/**
 * Function to update agent configuration - Professional, no downloads
 */
export async function updateAgentConfig(config) {
  try {
    const configWithTimestamp = {
      ...config,
      timestamp: Date.now()
    };
    
    // Store in localStorage for immediate UI update
    localStorage.setItem('autohealx_agentConfig', JSON.stringify(configWithTimestamp));
    localStorage.setItem('autohealx_userConfig', JSON.stringify(configWithTimestamp));
    
    // Write config signal to a known location for agent to read
    try {
      // Try API first (if available)
      const response = await fetch('/api/update-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configWithTimestamp)
      });
      
      if (response.ok) {
        console.log('✅ Agent config updated via API');
        return true;
      }
    } catch (apiError) {
      // API not available, use file-based communication
    }
    
    // Fallback: Write to localStorage with a signal flag
    localStorage.setItem('autohealx_configUpdate', JSON.stringify({
      config: configWithTimestamp,
      timestamp: Date.now(),
      processed: false
    }));
    
    console.log('✅ Agent config update signal created');
    return true;
  } catch (error) {
    console.error('Failed to update agent config:', error);
    return false;
  }
}