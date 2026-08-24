// ============================================================
// AutoHealX — Network Graphs Component (WiFi & Ethernet)
// Real-time network monitoring with detailed graphs
// ============================================================

import React, { useState, memo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';

const NetworkGraphs = memo(function NetworkGraphs({ latest, metrics }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Process network metrics data
  const processedData = metrics.map((metric, index) => {
    const wifi = metric.network?.find(n => n.type === 'wifi');
    const ethernet = metric.network?.find(n => n.type === 'ethernet');
    
    return {
      time: metric.timestamp ? format(new Date(metric.timestamp), 'HH:mm:ss') : `${index}`,
      fullTime: metric.timestamp ? new Date(metric.timestamp).toLocaleTimeString() : 'Unknown',
      wifiSent: wifi?.sent || 0,
      wifiReceived: wifi?.received || 0,
      wifiTotal: (wifi?.sent || 0) + (wifi?.received || 0),
      ethSent: ethernet?.sent || 0,
      ethReceived: ethernet?.received || 0,
      ethTotal: (ethernet?.sent || 0) + (ethernet?.received || 0),
    };
  }).slice(-30); // Last 30 data points

  // Get current network info
  const wifiData = latest?.network?.find(n => n.type === 'wifi');
  const ethData = latest?.network?.find(n => n.type === 'ethernet');

  // Custom tooltip for network graphs
  const NetworkTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="graph-tooltip-enhanced network-tooltip">
          <div className="tooltip-header">
            <strong>{payload[0]?.payload?.fullTime || label}</strong>
          </div>
          <div className="tooltip-content">
            {payload.map((entry, index) => (
              <div key={index} className="tooltip-row" style={{ color: entry.color }}>
                <span className="tooltip-label">{entry.name}:</span>
                <span className="tooltip-value">{entry.value?.toFixed(1) || 0} KB/s</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate network stats
  const getNetworkStats = () => {
    const stats = { wifi: { avg: 0, max: 0, current: 0 }, eth: { avg: 0, max: 0, current: 0 } };
    
    if (processedData.length > 0) {
      const wifiTotals = processedData.map(d => d.wifiTotal);
      const ethTotals = processedData.map(d => d.ethTotal);
      
      stats.wifi.avg = wifiTotals.reduce((a, b) => a + b, 0) / wifiTotals.length;
      stats.wifi.max = Math.max(...wifiTotals);
      stats.wifi.current = wifiTotals[wifiTotals.length - 1] || 0;
      
      stats.eth.avg = ethTotals.reduce((a, b) => a + b, 0) / ethTotals.length;
      stats.eth.max = Math.max(...ethTotals);
      stats.eth.current = ethTotals[ethTotals.length - 1] || 0;
    }
    
    return stats;
  };

  const stats = getNetworkStats();

  return (
    <div className="network-graphs-container">
      <div className="network-graphs-header">
        <h3>🌐 Network Monitoring</h3>
        <div className="network-tabs">
          <button 
            className={`network-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`network-tab ${activeTab === 'wifi' ? 'active' : ''}`}
            onClick={() => setActiveTab('wifi')}
          >
            📶 WiFi
          </button>
          <button 
            className={`network-tab ${activeTab === 'ethernet' ? 'active' : ''}`}
            onClick={() => setActiveTab('ethernet')}
          >
            🔌 Ethernet
          </button>
        </div>
      </div>

      {/* Network Cards */}
      <div className="network-cards">
        <div className={`network-card ${wifiData ? 'active' : 'inactive'}`}>
          <div className="network-card-icon">📶</div>
          <div className="network-card-info">
            <div className="network-card-name">WiFi</div>
            <div className="network-card-status">
              {wifiData ? (
                <>
                  <span className="status-dot online"></span>
                  <span>Connected - ↑{wifiData.sent} ↓{wifiData.received} KB/s</span>
                </>
              ) : (
                <>
                  <span className="status-dot offline"></span>
                  <span>Not Connected</span>
                </>
              )}
            </div>
          </div>
          <div className="network-card-stats">
            <div className="mini-stat">
              <span className="stat-label">Current</span>
              <span className="stat-value">{stats.wifi.current.toFixed(1)} KB/s</span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">Peak</span>
              <span className="stat-value">{stats.wifi.max.toFixed(1)} KB/s</span>
            </div>
          </div>
        </div>

        <div className={`network-card ${ethData ? 'active' : 'inactive'}`}>
          <div className="network-card-icon">🔌</div>
          <div className="network-card-info">
            <div className="network-card-name">Ethernet</div>
            <div className="network-card-status">
              {ethData ? (
                <>
                  <span className="status-dot online"></span>
                  <span>Connected - ↑{ethData.sent} ↓{ethData.received} KB/s</span>
                </>
              ) : (
                <>
                  <span className="status-dot offline"></span>
                  <span>Not Connected</span>
                </>
              )}
            </div>
          </div>
          <div className="network-card-stats">
            <div className="mini-stat">
              <span className="stat-label">Current</span>
              <span className="stat-value">{stats.eth.current.toFixed(1)} KB/s</span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">Peak</span>
              <span className="stat-value">{stats.eth.max.toFixed(1)} KB/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Content */}
      <div className="network-graph-content">
        {activeTab === 'overview' && (
          <div className="network-overview">
            <h4>📊 Combined Network Traffic</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="wifiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="ethGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<NetworkTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="wifiTotal" 
                  name="WiFi Total" 
                  stroke="#ec4899" 
                  fill="url(#wifiGradient)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="ethTotal" 
                  name="Ethernet Total" 
                  stroke="#06b6d4" 
                  fill="url(#ethGradient)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'wifi' && wifiData && (
          <div className="network-detail">
            <h4>📶 WiFi Traffic Details</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<NetworkTooltip />} />
                <Legend />
                <Bar dataKey="wifiSent" name="Upload (KB/s)" fill="#ec4899" />
                <Bar dataKey="wifiReceived" name="Download (KB/s)" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'ethernet' && ethData && (
          <div className="network-detail">
            <h4>🔌 Ethernet Traffic Details</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<NetworkTooltip />} />
                <Legend />
                <Bar dataKey="ethSent" name="Upload (KB/s)" fill="#06b6d4" />
                <Bar dataKey="ethReceived" name="Download (KB/s)" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {((activeTab === 'wifi' && !wifiData) || (activeTab === 'ethernet' && !ethData)) && (
          <div className="network-no-data">
            <div className="no-data-icon">📡</div>
            <p>No {activeTab} connection detected</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default NetworkGraphs;
