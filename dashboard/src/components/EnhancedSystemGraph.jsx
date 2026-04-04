// ============================================================
// AutoHealX — Enhanced System Graph with Process Details
// Real-time monitoring with grid pattern and process tooltips
// ============================================================

import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

const EnhancedSystemGraph = ({ metrics, agentStatus, onModeChange }) => {
  const [selectedMetric, setSelectedMetric] = useState('both');
  const [showProcesses, setShowProcesses] = useState(true);
  const [hoveredProcess, setHoveredProcess] = useState(null);

  // Debug: Log the metrics data
  console.log('📊 Graph received metrics:', metrics?.length || 0, 'data points');
  console.log('📊 Latest metric:', metrics?.[metrics.length - 1]);
  console.log('📊 Agent status:', agentStatus);

  // Process metrics data for display with real-time timestamps
  const processedData = metrics.map((metric, index) => ({
    ...metric,
    time: metric.timestamp ? format(new Date(metric.timestamp), 'HH:mm:ss') : `${index}`,
    fullTime: metric.timestamp ? new Date(metric.timestamp).toLocaleTimeString() : 'Unknown',
    displayTime: metric.timestamp ? format(new Date(metric.timestamp), 'h:mm:ss a') : 'Unknown'
  }));

  // Get latest metrics
  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const topProcess = latest?.topProcesses?.[0] || latest?.topCPU?.[0];

  // Enhanced tooltip with process details like the reference image
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const currentTime = new Date().toLocaleTimeString();
      
      return (
        <div className="graph-tooltip-enhanced">
          <div className="tooltip-header">
            <strong>{data.displayTime || currentTime}</strong>
          </div>
          <div className="tooltip-content">
            <div className="tooltip-row">
              <span className="tooltip-label">CPU:</span>
              <span className="tooltip-value cpu">{data.cpu?.toFixed(1) || 0}%</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Memory:</span>
              <span className="tooltip-value memory">{data.memory?.toFixed(1) || 0}%</span>
            </div>
            {data.topProcesses?.[0] && (
              <div className="tooltip-process-info">
                <div className="process-tooltip-card">
                  <div className="process-name-large">{data.topProcesses[0].name}</div>
                  <div className="process-details">
                    <span className="process-pid">{data.topProcesses[0].pid || 'N/A'}</span>
                    <span className="process-cpu">{data.topProcesses[0].cpu?.toFixed(0) || 0}%</span>
                    <span className="process-time">{currentTime}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Mode toggle handler - fixed to prevent file download
  const handleModeToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newMode = agentStatus?.mode === 'suggestion' ? 'auto' : 'suggestion';
    console.log('🔄 Mode toggle clicked:', agentStatus?.mode, '->', newMode);
    
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  // Real-time status indicator
  const getStatusColor = () => {
    if (agentStatus?.status === 'online') {
      return '#22c55e';
    }
    return '#ef4444';
  };

  return (
    <div className="enhanced-graph-container">
      
      {/* Graph Header with Real-time Controls */}
      <div className="graph-header">
        <div className="graph-title">
          <h3>🖥️ Real-Time System Metrics</h3>
          <div className="graph-status">
            <span 
              className={`status-indicator ${agentStatus?.status || 'offline'}`}
              style={{ backgroundColor: getStatusColor() }}
            ></span>
            <span>Agent {agentStatus?.status === 'online' ? 'Online' : 'Offline'}</span>
            {agentStatus?.status === 'online' && (
              <span className="live-indicator">● LIVE</span>
            )}
          </div>
        </div>
        
        <div className="graph-controls">
          {/* Metric Selector */}
          <div className="metric-selector">
            <button 
              className={`metric-btn ${selectedMetric === 'cpu' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('cpu')}
            >
              🖥️ CPU
            </button>
            <button 
              className={`metric-btn ${selectedMetric === 'memory' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('memory')}
            >
              💾 Memory
            </button>
            <button 
              className={`metric-btn ${selectedMetric === 'both' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('both')}
            >
              📊 Both
            </button>
          </div>

          {/* Mode Toggle - Fixed */}
          {agentStatus && (
            <div className="mode-control">
              <label className="mode-toggle" onClick={handleModeToggle}>
                <input
                  type="checkbox"
                  checked={agentStatus.mode === 'auto'}
                  onChange={() => {}} // Handled by onClick
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="toggle-slider"></span>
                <span className="mode-label">
                  {agentStatus.mode === 'auto' ? '🤖 Auto Mode' : '👤 Manual Mode'}
                </span>
              </label>
            </div>
          )}

          {/* Process Toggle */}
          <button 
            className={`process-toggle ${showProcesses ? 'active' : ''}`}
            onClick={() => setShowProcesses(!showProcesses)}
          >
            ⚙️ Processes
          </button>
        </div>
      </div>

      {/* Main Graph with Grid Pattern */}
      <div className="graph-content graph-with-grid">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            
            {/* Enhanced Grid Pattern */}
            <CartesianGrid 
              strokeDasharray="1 1" 
              stroke="rgba(34, 197, 94, 0.2)" 
              strokeWidth={0.5}
            />
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#94a3b8"
              fontSize={11}
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Critical thresholds */}
            <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" opacity={0.7} />
            <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} />
            
            {/* CPU Area */}
            {(selectedMetric === 'cpu' || selectedMetric === 'both') && (
              <Area
                type="monotone"
                dataKey="cpu"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#cpuGradient)"
              />
            )}
            
            {/* Memory Area */}
            {(selectedMetric === 'memory' || selectedMetric === 'both') && (
              <Area
                type="monotone"
                dataKey="memory"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#memoryGradient)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Real-time Stats */}
      <div className="graph-stats">
        <div className="stat-item">
          <span className="stat-label">CPU:</span>
          <span className={`stat-value ${latest?.cpu > 90 ? 'critical' : latest?.cpu > 75 ? 'warning' : 'normal'}`}>
            {latest?.cpu?.toFixed(1) || 0}%
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Memory:</span>
          <span className={`stat-value ${latest?.memory > 88 ? 'critical' : latest?.memory > 75 ? 'warning' : 'normal'}`}>
            {latest?.memory?.toFixed(1) || 0}%
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Processes:</span>
          <span className="stat-value">{latest?.processCount || 0}</span>
        </div>
        {topProcess && (
          <div className="stat-item top-process">
            <span className="stat-label">Top Process:</span>
            <span className="stat-value process-highlight">
              {topProcess.name} ({topProcess.cpu?.toFixed(1) || 0}%)
            </span>
          </div>
        )}
        <div className="stat-item">
          <span className="stat-label">Last Update:</span>
          <span className="stat-value time-value">
            {latest?.timestamp ? format(new Date(latest.timestamp), 'h:mm:ss a') : 'Never'}
          </span>
        </div>
      </div>

      {/* Enhanced Process List with Hover Effects */}
      {showProcesses && latest?.topProcesses && latest.topProcesses.length > 0 && (
        <div className="process-list">
          <h4>🔥 Top CPU Processes (Real-time)</h4>
          <div className="process-grid">
            {latest.topProcesses.slice(0, 6).map((process, index) => (
              <div 
                key={index} 
                className="process-item enhanced"
                onMouseEnter={() => setHoveredProcess(process)}
                onMouseLeave={() => setHoveredProcess(null)}
              >
                <div className="process-info">
                  <span className="process-name">{process.name || 'Unknown'}</span>
                  <span className="process-pid">PID: {process.pid || 'N/A'}</span>
                  <span className="process-timestamp">
                    {format(new Date(), 'h:mm:ss a')}
                  </span>
                </div>
                <div className="process-usage">
                  <div className="usage-bar">
                    <div 
                      className="usage-fill"
                      style={{ 
                        width: `${Math.min(Math.max(process.cpu || 0, 0), 100)}%`,
                        backgroundColor: (process.cpu || 0) > 70 ? '#ef4444' : 
                                       (process.cpu || 0) > 40 ? '#f59e0b' : '#22c55e'
                      }}
                    ></div>
                  </div>
                  <span className="usage-text">{(process.cpu || 0).toFixed(1)}%</span>
                </div>
                
                {/* Hover tooltip like reference image */}
                {hoveredProcess === process && (
                  <div className="process-hover-tooltip">
                    <div className="tooltip-process-name">{process.name}</div>
                    <div className="tooltip-process-pid">{process.pid}</div>
                    <div className="tooltip-process-cpu">{(process.cpu || 0).toFixed(0)}%</div>
                    <div className="tooltip-process-time">{format(new Date(), 'h:mm:ss a')}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSystemGraph;