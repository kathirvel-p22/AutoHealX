// ============================================================
// AutoHealX — Device Manager (STABLE VERSION - NO AUTO-REFRESH)
// Multi-device control and pairing system with form stability
// ============================================================

import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

const DeviceManager = ({ onDeviceSelect, selectedDevice }) => {
  // Stable form state management
  const [formState, setFormState] = useState({
    showAddDevice: false,
    deviceCode: '',
    deviceName: '',
    loading: false
  });
  
  const formRef = useRef(null);
  
  // Mock devices for demo (since we're bypassing AuthContext)
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

  // Stable form update function
  const updateFormState = useCallback((updates) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  // Stable form submission
  const handleAddDevice = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔗 Device pairing attempt:', {
      deviceName: formState.deviceName.trim(),
      deviceCode: formState.deviceCode.trim()
    });
    
    if (formState.loading) {
      console.log('🔗 Already processing, ignoring duplicate submission');
      return false;
    }
    
    // Validate inputs
    if (!formState.deviceName.trim()) {
      toast.error('Please enter a device name');
      return false;
    }
    
    if (!formState.deviceCode.trim()) {
      toast.error('Please enter the pairing code');
      return false;
    }
    
    if (formState.deviceCode.trim().length !== 6) {
      toast.error('Pairing code must be 6 characters');
      return false;
    }
    
    updateFormState({ loading: true });
    console.log('🔗 Starting device pairing...');

    try {
      // Simulate device pairing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('🔗 Device pairing successful!');
      toast.success(`Device "${formState.deviceName}" paired successfully!`);
      
      // Reset form and close modal
      updateFormState({
        deviceCode: '',
        deviceName: '',
        showAddDevice: false,
        loading: false
      });
      
    } catch (error) {
      console.error('🔗 Device pairing error:', error);
      updateFormState({ loading: false });
      toast.error('Failed to pair device. Please try again.');
    }
    
    return false;
  }, [formState, updateFormState]);

  // Modal control functions
  const openModal = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    updateFormState({ showAddDevice: true });
  }, [updateFormState]);

  const closeModal = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!formState.loading) {
      updateFormState({ 
        showAddDevice: false,
        deviceCode: '',
        deviceName: ''
      });
    }
  }, [formState.loading, updateFormState]);

  const getDeviceStatus = (device) => {
    if (!device.lastHeartbeat) return 'offline';
    
    const lastSeen = new Date(device.lastHeartbeat);
    const now = new Date();
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    
    if (diffMinutes < 2) return 'online';
    if (diffMinutes < 10) return 'warning';
    return 'offline';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="device-section">
      <div className="device-section-header">
        <div className="device-section-title">
          <span className="device-icon">🖥️</span>
          <h3>My Devices</h3>
          <span className="device-count-badge">{mockDevices.length}</span>
        </div>
        <button 
          type="button"
          className="add-device-button"
          onClick={openModal}
          disabled={formState.loading}
        >
          <span>+</span> Add Device
        </button>
      </div>

      {formState.showAddDevice && (
        <div className="add-device-modal">
          <div className="modal-backdrop" onClick={closeModal}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h3>🔗 Pair New Device</h3>
              <button 
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={formState.loading}
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

            <form 
              ref={formRef}
              onSubmit={handleAddDevice} 
              className="add-device-form"
              noValidate
              autoComplete="off"
              style={{ isolation: 'isolate' }}
            >
              <div className="form-group">
                <label>Device Name</label>
                <input
                  type="text"
                  value={formState.deviceName}
                  onChange={(e) => updateFormState({ deviceName: e.target.value })}
                  placeholder="e.g., My Laptop, Lab PC, Server"
                  required
                  disabled={formState.loading}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>

              <div className="form-group">
                <label>Pairing Code</label>
                <input
                  type="text"
                  value={formState.deviceCode}
                  onChange={(e) => updateFormState({ deviceCode: e.target.value.toUpperCase() })}
                  placeholder="Enter 6-digit code from agent"
                  maxLength={6}
                  pattern="[A-Z0-9]{6}"
                  required
                  disabled={formState.loading}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={closeModal}
                  disabled={formState.loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={formState.loading || !formState.deviceName.trim() || !formState.deviceCode.trim()}
                >
                  {formState.loading ? 'Pairing...' : 'Pair Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="devices-grid">
        {mockDevices.length === 0 ? (
          <div className="no-devices-state">
            <div className="no-devices-icon">📱</div>
            <h4 className="no-devices-title">No Devices Connected</h4>
            <p className="no-devices-description">Add your first device to start monitoring</p>
            <button 
              type="button"
              className="no-devices-action"
              onClick={openModal}
            >
              Add Device
            </button>
          </div>
        ) : (
          mockDevices.map((device) => {
            const isSelected = selectedDevice?.id === device.id;
            
            return (
              <div 
                key={device.id}
                className={`device-card-enhanced ${isSelected ? 'selected' : ''}`}
                onClick={() => onDeviceSelect(device)}
              >
                <div className="device-card-header">
                  <div className="device-main-info">
                    <div className="device-name-row">
                      <span className="device-type-icon">💻</span>
                      <div>
                        <h4 className="device-name-text">{device.deviceName}</h4>
                        <p className="device-hostname">{device.hostname || 'Unknown'}</p>
                      </div>
                    </div>
                    <p className="device-platform">{device.platform || 'Unknown OS'}</p>
                  </div>

                  <div className="device-status-indicator">
                    <div className="status-dot-large"></div>
                    <div className="status-text-large">Online</div>
                    <div className="last-seen-text">Just now</div>
                  </div>
                </div>

                {device.lastMetrics && (
                  <div className="device-metrics-row">
                    <div className="metric-item">
                      <div className="metric-label-text">CPU</div>
                      <div className="metric-value-text cpu">{device.lastMetrics.cpu}%</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-label-text">RAM</div>
                      <div className="metric-value-text memory">{device.lastMetrics.memory}%</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {mockDevices.length > 0 && (
        <div className="device-summary-stats">
          <div className="summary-stat-item">
            <span className="summary-stat-value online">{mockDevices.length}</span>
            <span className="summary-stat-label">Online</span>
          </div>
          <div className="summary-stat-item">
            <span className="summary-stat-value warning">0</span>
            <span className="summary-stat-label">Warning</span>
          </div>
          <div className="summary-stat-item">
            <span className="summary-stat-value offline">0</span>
            <span className="summary-stat-label">Offline</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManager;