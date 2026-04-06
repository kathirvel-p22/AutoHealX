// ============================================================
// AutoHealX — Main Dashboard App with Authentication
// Secure multi-device monitoring and control system
// ============================================================

import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import SimpleLoginPage from './components/SimpleLoginPage';
// import LoginPage from './components/SimpleLoginPage';
// import LoginPage from './components/LoginPage';
import UserProfile from './components/UserProfile';
import EnhancedSystemGraph from './components/EnhancedSystemGraph';
import DynamicHardwareGraphs from './components/DynamicHardwareGraphs';
import SystemOverviewPanel from './components/SystemOverviewPanel';
import AlertPanel from './components/AlertPanel';
import FixHistory from './components/FixHistory';
import KnowledgePanel from './components/KnowledgePanel';
import ProcessTable from './components/ProcessTable';
import IntelligencePanel from './components/IntelligencePanel';
import OnboardingModal from './components/OnboardingModal';
import ActionApprovalModal from './components/ActionApprovalModal';
import {
  useMetrics,
  useAlerts,
  useFixLogs,
  useAgentStatus,
  useKnowledge,
  usePendingActions,
  updateAgentConfig,
  approveAction,
  rejectAction
} from './hooks/useBridgeData';
import './App.css';

const Dashboard = memo(function Dashboard() {
  console.log('🔄 Dashboard render at:', new Date().toLocaleTimeString());
  // Mock devices for persistent selection (matching DeviceManager)
  const mockDevices = [
    {
      id: 'demo-device-laptop',
      deviceName: 'My Laptop',
      hostname: 'KATHIRVEL-PC',
      platform: 'Windows 11',
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
      lastMetrics: { cpu: 45, memory: 76, processCount: 312 }
    },
    {
      id: 'demo-device-lab', 
      deviceName: 'Lab PC',
      hostname: 'LAB-PC-01',
      platform: 'Windows 10',
      status: 'online',
      lastHeartbeat: new Date(Date.now() - 300000).toISOString(),
      lastMetrics: { cpu: 23, memory: 45, processCount: 287 }
    }
  ];

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showComprehensive, setShowComprehensive] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isStable, setIsStable] = useState(false); // Stability flag

  // PERSISTENT TAB SELECTION - Load from localStorage (FIXED DEPENDENCIES)
  useEffect(() => {
    const savedTab = localStorage.getItem('autohealx_activeTab');
    console.log('📋 Checking for saved tab selection:', savedTab);
    
    if (savedTab && savedTab !== activeTab) {
      console.log('📋 Restoring previously selected tab:', savedTab);
      setActiveTab(savedTab);
    } else if (!savedTab) {
      console.log('📋 No saved tab, defaulting to dashboard');
      localStorage.setItem('autohealx_activeTab', 'dashboard');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // PERSISTENT TAB SELECTION - Save to localStorage when tab changes
  const handleTabChange = useCallback((tabName) => {
    console.log('📋 Tab selected:', tabName);
    setActiveTab(tabName);
    localStorage.setItem('autohealx_activeTab', tabName);
  }, []);

  // Use device-specific data or fallback to local data
  const isAuthenticated = true; // Always authenticated in this demo
  
  // Debug: Log component mount/unmount and stability
  useEffect(() => {
    console.log('🔄 Dashboard component mounted');
    // Set stability flag after initial mount
    const stabilityTimer = setTimeout(() => {
      setIsStable(true);
      console.log('✅ Dashboard stabilized - preventing unnecessary re-renders');
    }, 1000);
    
    return () => {
      console.log('🔄 Dashboard component unmounting');
      clearTimeout(stabilityTimer);
    };
  }, []);
  
  // STABLE DATA HOOKS - Only update when component is stable
  const { metrics, latest } = useMetrics(50, isAuthenticated && isStable);
  const { alerts } = useAlerts(20, isAuthenticated && isStable);
  const { fixLogs } = useFixLogs(20, isAuthenticated && isStable);
  const { agentStatus } = useAgentStatus(isAuthenticated && isStable);
  const { knowledge } = useKnowledge(isAuthenticated && isStable);
  const { pendingActions } = usePendingActions(isAuthenticated && isStable);

  // Monitor data refresh to update last refresh time (DEBOUNCED)
  const lastUpdateRef = useRef(null);
  useEffect(() => {
    if (latest && latest.timestamp && isStable) {
      // Debounce updates to prevent rapid re-renders
      if (lastUpdateRef.current) {
        clearTimeout(lastUpdateRef.current);
      }
      
      lastUpdateRef.current = setTimeout(() => {
        const newRefreshTime = new Date(latest.timestamp);
        setLastRefresh(newRefreshTime);
        console.log('📊 Data refreshed at:', newRefreshTime.toLocaleTimeString());
      }, 500); // 500ms debounce
    }
    
    return () => {
      if (lastUpdateRef.current) {
        clearTimeout(lastUpdateRef.current);
      }
    };
  }, [latest, isStable]); // Add latest dependency

  // PERSISTENT DEVICE SELECTION - Load from localStorage (FIXED DEPENDENCIES)
  useEffect(() => {
    const savedDeviceId = localStorage.getItem('autohealx_selectedDevice');
    console.log('🖥️ Checking for saved device selection:', savedDeviceId);
    
    if (savedDeviceId && mockDevices.length > 0) {
      // Try to find the previously selected device
      const savedDevice = mockDevices.find(device => device.id === savedDeviceId);
      if (savedDevice && (!selectedDevice || selectedDevice.id !== savedDevice.id)) {
        console.log('🖥️ Restoring previously selected device:', savedDevice.deviceName);
        setSelectedDevice(savedDevice);
        return;
      }
    }
    
    // Auto-select first device if no saved selection or saved device not found
    if (mockDevices.length > 0 && !selectedDevice) {
      console.log('🖥️ Auto-selecting first device:', mockDevices[0].deviceName);
      setSelectedDevice(mockDevices[0]);
      localStorage.setItem('autohealx_selectedDevice', mockDevices[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // PERSISTENT DEVICE SELECTION - Save to localStorage when device changes
  const handleDeviceSelect = useCallback((device) => {
    console.log('🖥️ Device selected:', device.deviceName);
    setSelectedDevice(device);
    localStorage.setItem('autohealx_selectedDevice', device.id);
  }, []);

  // Show onboarding for new users (STABLE)
  useEffect(() => {
    if (mockDevices.length === 0 && isStable) {
      setShowOnboarding(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStable]); // Only check when stable

  // Handle pending actions (STABLE)
  useEffect(() => {
    if (pendingActions && pendingActions.length > 0 && isStable) {
      setPendingAction(pendingActions[0]);
    }
  }, [pendingActions, isStable]);

  const handleModeToggle = useCallback(async () => {
    if (!selectedDevice) {
      toast.error('Please select a device first');
      return;
    }

    const newMode = agentStatus?.mode === 'autonomous' ? 'suggestion' : 'autonomous';
    const success = await updateAgentConfig(selectedDevice.id, { mode: newMode });
    
    if (success) {
      toast.success(`Mode changed to ${newMode}`);
    } else {
      toast.error('Failed to update mode');
    }
  }, [agentStatus?.mode, selectedDevice]);

  const handleActionApproval = useCallback(async (actionId, approved, reason) => {
    if (!selectedDevice) return;

    const success = approved 
      ? await approveAction(selectedDevice.id, actionId, reason)
      : await rejectAction(selectedDevice.id, actionId, reason);
    
    if (success) {
      toast.success(approved ? 'Action approved' : 'Action rejected');
      setPendingAction(null);
    } else {
      toast.error('Failed to process action');
    }
  }, [selectedDevice]);

  const getDeviceStatusColor = () => {
    if (!selectedDevice || !agentStatus) return '#6b7280';
    
    // Trust the agent's reported status first
    if (agentStatus.status === 'online') {
      // Additional validation: check if heartbeat is recent
      if (agentStatus.lastHeartbeat) {
        const lastHeartbeat = new Date(agentStatus.lastHeartbeat);
        const now = new Date();
        const diffMinutes = (now - lastHeartbeat) / (1000 * 60);
        
        if (diffMinutes < 2) return '#22c55e'; // Green - very recent
        if (diffMinutes < 5) return '#f59e0b'; // Yellow - somewhat recent
      }
      return '#22c55e'; // Green - agent says online
    }
    
    return '#ef4444'; // Red - agent says offline
  };

  const getAgentStatusText = () => {
    if (!agentStatus) return 'Connecting...';
    
    if (agentStatus.status === 'online') {
      // Check heartbeat freshness for more detailed status
      if (agentStatus.lastHeartbeat) {
        const lastHeartbeat = new Date(agentStatus.lastHeartbeat);
        const now = new Date();
        const diffMinutes = (now - lastHeartbeat) / (1000 * 60);
        
        if (diffMinutes < 1) return 'Online (Live)';
        if (diffMinutes < 5) return 'Online';
      }
      return 'Online';
    }
    
    return 'Offline';
  };

  return (
    <div className="app">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151'
          }
        }}
      />

      {/* Header with Device Management */}
      <header className="app-header">
        <div className="header-left">
          <div className="app-logo">
            <div className="logo-icon">🛡️</div>
            <div className="logo-text">
              <h1>AutoHealX</h1>
              <span>Multi-Device System Management</span>
            </div>
          </div>
        </div>

        <div className="header-center">
          {selectedDevice && (
            <div className="selected-device-info">
              <div className="device-indicator">
                <div 
                  className="device-status-dot"
                  style={{ backgroundColor: getDeviceStatusColor() }}
                ></div>
                <span className="device-name">{selectedDevice.deviceName}</span>
                <span className="device-hostname">{selectedDevice.hostname}</span>
              </div>
            </div>
          )}
        </div>

        <div className="header-right">
          <UserProfile />
        </div>
      </header>

      {/* Horizontal Device Selector */}
      <div className="horizontal-device-selector">
        <div className="device-selector-header">
          <h3>📱 My Devices</h3>
          <button className="add-device-btn-small" onClick={() => setShowAddDevice(true)}>
            + Add Device
          </button>
        </div>
        <div className="horizontal-device-list">
          {mockDevices.map((device) => {
            const isSelected = selectedDevice?.id === device.id;
            return (
              <div 
                key={device.id}
                className={`horizontal-device-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleDeviceSelect(device)}
              >
                <div className="device-icon-large">💻</div>
                <div className="device-info-compact">
                  <div className="device-name-compact">{device.deviceName}</div>
                  <div className="device-details-compact">
                    {device.hostname} | {device.platform}
                  </div>
                  <div className="device-status-compact">
                    <div className="status-dot-small" style={{ backgroundColor: '#22c55e' }}></div>
                    <span>Online</span>
                  </div>
                </div>
                {device.lastMetrics && (
                  <div className="device-metrics-compact">
                    <div className="metric-compact">
                      <span className="metric-label-small">CPU</span>
                      <span className="metric-value-small">{device.lastMetrics.cpu}%</span>
                    </div>
                    <div className="metric-compact">
                      <span className="metric-label-small">RAM</span>
                      <span className="metric-value-small">{device.lastMetrics.memory}%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-tab ${activeTab === 'engine' ? 'active' : ''}`}
            onClick={() => handleTabChange('engine')}
          >
            🧠 AI Engine
          </button>
          <button 
            className={`nav-tab ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => handleTabChange('alerts')}
          >
            🚨 Alerts
            {alerts.length > 0 && <span className="alert-badge">{alerts.length}</span>}
          </button>
          <button 
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            🔧 Fix History
          </button>
          <button 
            className={`nav-tab ${activeTab === 'knowledge' ? 'active' : ''}`}
            onClick={() => handleTabChange('knowledge')}
          >
            📚 Knowledge
          </button>
          <button 
            className={`nav-tab ${activeTab === 'processes' ? 'active' : ''}`}
            onClick={() => handleTabChange('processes')}
          >
            ⚙️ Processes
          </button>
        </div>
      </nav>

      <div className="app-body">
        {/* Remove sidebar, use full width for dashboard */}

        {/* Main Content - Full Width */}
        <main className="app-main-fullwidth">
          {!selectedDevice ? (
            <div className="no-device-selected">
              <div className="no-device-icon">🖥️</div>
              <h2>Select a Device</h2>
              <p>Choose a device from above to start monitoring</p>
            </div>
          ) : (
            <>
              {/* Metric Cards Row */}
              <div className="metrics-row">
                <div className="metric-card-small">
                  <div className="metric-icon-small">�️</div>
                  <div className="metric-value-small">{latest?.cpu?.toFixed(2) || 0}%</div>
                  <div className="metric-label-small">CPU USAGE</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: `${Math.min(latest?.cpu || 0, 100)}%`, background: (latest?.cpu || 0) > 80 ? '#ef4444' : (latest?.cpu || 0) > 60 ? '#f59e0b' : '#22c55e' }}></div>
                  </div>
                </div>
                <div className="metric-card-small">
                  <div className="metric-icon-small">💾</div>
                  <div className="metric-value-small">{latest?.memory?.toFixed(2) || 0}%</div>
                  <div className="metric-label-small">MEMORY USAGE</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: `${Math.min(latest?.memory || 0, 100)}%`, background: (latest?.memory || 0) > 85 ? '#ef4444' : (latest?.memory || 0) > 70 ? '#f59e0b' : '#22c55e' }}></div>
                  </div>
                </div>
                <div className="metric-card-small">
                  <div className="metric-icon-small">⚙️</div>
                  <div className="metric-value-small">{latest?.processCount || 0}</div>
                  <div className="metric-label-small">ACTIVE PROCESSES</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: `${Math.min((latest?.processCount || 0) / 4, 100)}%`, background: '#22c55e' }}></div>
                  </div>
                </div>
                <div className="metric-card-small">
                  <div className="metric-icon-small">🚨</div>
                  <div className="metric-value-small">{alerts?.filter(a => !a.resolved).length || 0}</div>
                  <div className="metric-label-small">ALERTS ACTIVE</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: `${Math.min((alerts?.filter(a => !a.resolved).length || 0) * 20, 100)}%`, background: (alerts?.filter(a => !a.resolved).length || 0) > 0 ? '#f59e0b' : '#22c55e' }}></div>
                  </div>
                </div>
                <div className="metric-card-small">
                  <div className="metric-icon-small">✅</div>
                  <div className="metric-value-small">{fixLogs?.length || 0}</div>
                  <div className="metric-label-small">FIXES APPLIED</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: `${Math.min((fixLogs?.length || 0) * 10, 100)}%`, background: '#22c55e' }}></div>
                  </div>
                </div>
                <div className="metric-card-small">
                  <div className="metric-icon-small">🧠</div>
                  <div className="metric-value-small">{knowledge?.length || 0}</div>
                  <div className="metric-label-small">PATTERNS LEARNED</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: `${Math.min((knowledge?.length || 0) * 20, 100)}%`, background: '#8b5cf6' }}></div>
                  </div>
                </div>
              </div>

              {/* Agent Status Bar */}
              <div className="agent-status-bar">
                <div className="status-item">
                  <span className="status-label-bar">Agent:</span>
                  <span className={`status-value-bar ${agentStatus?.status === 'online' ? 'online' : 'offline'}`}>
                    {agentStatus?.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="status-divider">|</div>
                <div className="status-item">
                  <span className="status-label-bar">Mode:</span>
                  <span className="status-value-bar mode">{agentStatus?.mode === 'autonomous' ? 'AUTONOMOUS' : 'SUGGESTION'}</span>
                </div>
                <div className="status-divider">|</div>
                <div className="status-item">
                  <span className="status-label-bar">Cycles:</span>
                  <span className="status-value-bar">{agentStatus?.cycleCount || 0}</span>
                </div>
              </div>

              {/* Dashboard Content Based on Active Tab */}
              {activeTab === 'dashboard' && (
                showComprehensive ? (
                  <div className="comprehensive-dashboard">
                    <div className="dashboard-row">
                      <div className="dashboard-col-3">
                        <IntelligencePanel alerts={alerts} fixLogs={fixLogs} />
                        <AlertPanel alerts={alerts} />
                      </div>
                      <div className="dashboard-col-6">
                        <ProcessTable 
                          processes={latest?.allProcesses || []} 
                          deviceId={selectedDevice.id}
                        />
                      </div>
                      <div className="dashboard-col-3">
                        <FixHistory fixLogs={fixLogs} />
                        <KnowledgePanel knowledge={knowledge} />
                      </div>
                    </div>
                    <div className="dashboard-row">
                      <div className="dashboard-col-6">
                        <EnhancedSystemGraph latest={latest} metrics={metrics} agentStatus={agentStatus} />
                      </div>
                      <div className="dashboard-col-6">
                        <SystemOverviewPanel latest={latest} metrics={metrics} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="simple-dashboard">
                    {/* Main Metrics Row */}
                    <div className="dashboard-grid">
                      <div className="grid-item large">
                        <EnhancedSystemGraph latest={latest} metrics={metrics} agentStatus={agentStatus} />
                      </div>
                      <div className="grid-item large">
                        <SystemOverviewPanel latest={latest} metrics={metrics} />
                      </div>
                    </div>
                    
                    {/* Alerts & Intelligence Row */}
                    <div className="dashboard-grid">
                      <div className="grid-item medium">
                        <AlertPanel alerts={alerts} />
                      </div>
                      <div className="grid-item medium">
                        <IntelligencePanel alerts={alerts} fixLogs={fixLogs} />
                      </div>
                    </div>
                  </div>
                )
              )}

              {activeTab === 'engine' && (
                <div className="tab-content">
                  <div className="tab-header">
                    <h2>🧠 AI Engine</h2>
                    <p>Intelligent system analysis and decision making</p>
                  </div>
                  <div className="engine-content">
                    <IntelligencePanel alerts={alerts} fixLogs={fixLogs} />
                    <div className="engine-stats">
                      <div className="stat-card">
                        <h3>Patterns Learned</h3>
                        <div className="stat-value">0</div>
                      </div>
                      <div className="stat-card">
                        <h3>Fixes Applied</h3>
                        <div className="stat-value">1</div>
                      </div>
                      <div className="stat-card">
                        <h3>Success Rate</h3>
                        <div className="stat-value">100%</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="tab-content">
                  <div className="tab-header">
                    <h2>🚨 System Alerts</h2>
                    <p>Active alerts and system notifications</p>
                  </div>
                  <AlertPanel alerts={alerts} />
                </div>
              )}

              {activeTab === 'history' && (
                <div className="tab-content">
                  <div className="tab-header">
                    <h2>🔧 Fix History</h2>
                    <p>History of automated fixes and system actions</p>
                  </div>
                  <FixHistory fixLogs={fixLogs} />
                </div>
              )}

              {activeTab === 'knowledge' && (
                <div className="tab-content">
                  <div className="tab-header">
                    <h2>📚 Knowledge Base</h2>
                    <p>System knowledge and learned patterns</p>
                  </div>
                  <KnowledgePanel knowledge={knowledge} />
                </div>
              )}

              {activeTab === 'processes' && (
                <div className="tab-content">
                  <div className="tab-header">
                    <h2>⚙️ System Processes</h2>
                    <p>Running processes and system activity</p>
                  </div>
                  <ProcessTable 
                    processes={latest?.allProcesses || []} 
                    deviceId={selectedDevice.id}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}

      {pendingAction && (
        <ActionApprovalModal
          action={pendingAction}
          onApprove={(reason) => handleActionApproval(pendingAction.id, true, reason)}
          onReject={(reason) => handleActionApproval(pendingAction.id, false, reason)}
          onClose={() => setPendingAction(null)}
        />
      )}

      {/* Device Pairing Modal */}
      {showAddDevice && (
        <div className="add-device-modal">
          <div className="modal-backdrop" onClick={() => setShowAddDevice(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h3>🔗 Pair New Device</h3>
              <button 
                type="button"
                className="modal-close"
                onClick={() => setShowAddDevice(false)}
              >
                ×
              </button>
            </div>
            
            <div className="pairing-instructions">
              <div className="instruction-step">
                <div className="step-number">1</div>
                <div className="step-text">
                  <strong>Start AutoHealX Agent</strong> on your device
                </div>
              </div>
              <div className="instruction-step">
                <div className="step-number">2</div>
                <div className="step-text">
                  <strong>Copy the pairing code</strong> from the agent console
                </div>
              </div>
              <div className="instruction-step">
                <div className="step-number">3</div>
                <div className="step-text">
                  <strong>Enter the code below</strong> to link the device
                </div>
              </div>
            </div>

            <form className="add-device-form" onSubmit={(e) => {
              e.preventDefault();
              toast.success('Device pairing simulated successfully!');
              setShowAddDevice(false);
            }}>
              <div className="form-group">
                <label>Device Name</label>
                <input
                  type="text"
                  placeholder="e.g., My Laptop, Lab PC, Server"
                  required
                />
              </div>

              <div className="form-group">
                <label>Pairing Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code from agent"
                  maxLength={6}
                  required
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowAddDevice(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  Pair Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

// ─── Main App Component with Persistent Authentication ─────────────────
function App() {
  // Check authentication from both URL and localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const urlAuthenticated = urlParams.get('authenticated') === 'true';
  const storageAuthenticated = localStorage.getItem('autohealx_authenticated') === 'true';
  
  const isAuthenticated = urlAuthenticated || storageAuthenticated;
  
  if (isAuthenticated) {
    // Clear the URL parameter but keep localStorage
    if (urlAuthenticated) {
      window.history.replaceState({}, document.title, '/');
    }
    
    return (
      <AuthProvider>
        <AuthenticatedDashboard />
      </AuthProvider>
    );
  }
  
  // Show simple login page
  return <SimpleLoginPage />;
}

// ─── Authenticated Dashboard with Logout ──────────────────────────────
function AuthenticatedDashboard() {
  const handleLogout = () => {
    // Clear authentication state AND selected device AND active tab
    localStorage.removeItem('autohealx_authenticated');
    localStorage.removeItem('autohealx_user');
    localStorage.removeItem('autohealx_selectedDevice'); // Clear device selection
    localStorage.removeItem('autohealx_activeTab'); // Clear tab selection
    // Redirect to login
    window.location.href = '/';
  };

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('autohealx_user') || '{}');
  
  return (
    <div>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151'
          }
        }}
      />
      
      <div className="welcome-banner" style={{
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        color: 'white',
        padding: '20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="welcome-content">
          <h2>🎉 Welcome to AutoHealX Dashboard!</h2>
          <p>Hello {userInfo.name || 'User'} - Device selection is now persistent!</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
      
      <Dashboard />
    </div>
  );
}

// ─── Original App with Authentication (Commented Out) ─────────────────
/*
function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { currentUser } = useAuth();

  // CRITICAL: Completely isolate login page from any dashboard logic
  if (!currentUser) {
    console.log('🔐 No user - showing isolated login page');
    return (
      <div style={{ isolation: 'isolate', contain: 'layout style paint' }}>
        <LoginPage />
      </div>
    );
  }

  // Once authenticated, show the dashboard with real-time monitoring
  console.log('🔐 User authenticated - showing dashboard');
  return <Dashboard />;
}
*/

export default App;