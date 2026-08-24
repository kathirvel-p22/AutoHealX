// ============================================================
// AutoHealX — System Overview Panel
// Simple mini sparkline graphs for Memory, Disk, WiFi, GPU
// ============================================================

import React, { memo } from 'react';
import {
  AreaChart, Area, ResponsiveContainer
} from 'recharts';

// Sparkline component - compact mini graph
const Sparkline = memo(function Sparkline({ data, color }) {
  return (
    <div className="sparkline-container">
      <ResponsiveContainer width="100%" height={30}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`sparklineGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="100%" stopColor={color} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={1.5}
            fill={`url(#sparklineGradient-${color})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

const SystemOverviewPanel = memo(function SystemOverviewPanel({ latest, metrics }) {
  // Process memory data
  const memoryData = metrics.map((m, i) => ({ value: m.memory || 0 })).slice(-20);
  
  // Process disk data
  const diskData = metrics.map((m, i) => ({ 
    value: m.disks?.[0]?.usage || 0 
  })).slice(-20);
  
  // Process WiFi data (show received traffic)
  const wifiData = metrics.map((m, i) => ({ 
    value: m.network?.find(n => n.type === 'wifi')?.received || 0 
  })).slice(-20);
  
  // Process GPU 0 data (Intel)
  const gpu0Data = metrics.map((m, i) => ({ 
    value: m.gpu?.[0]?.usage || 0 
  })).slice(-20);
  
  // Process GPU 1 data (NVIDIA)
  const gpu1Data = metrics.map((m, i) => ({ 
    value: m.gpu?.[1]?.usage || 0 
  })).slice(-20);

  // Get current values
  const memoryValue = latest?.memory || 0;
  const diskValue = latest?.disks?.[0]?.usage || 0;
  const diskName = latest?.disks?.[0]?.name || 'Disk 0 (C:)';
  const diskType = latest?.disks?.[0]?.type || 'SSD';
  
  const wifiInfo = latest?.network?.find(n => n.type === 'wifi');
  const wifiConnected = !!wifiInfo;
  const wifiReceived = wifiInfo?.received || 0;
  
  const gpu0Info = latest?.gpu?.[0];
  const gpu0Name = gpu0Info?.name || 'Intel(R) UHD Graphics';
  const gpu0Usage = gpu0Info?.usage || 0;
  
  const gpu1Info = latest?.gpu?.[1];
  const gpu1Name = gpu1Info?.name || 'NVIDIA GeForce RTX 2050';
  const gpu1Usage = gpu1Info?.usage || 0;
  const gpu1Temp = gpu1Info?.temperature || 0;

  return (
    <div className="system-overview-panel">
      <h3 className="panel-title">📊 System Overview</h3>
      
      {/* Memory Section */}
      <div className="overview-section">
        <div className="overview-header">
          <div className="overview-icon">💾</div>
          <div className="overview-info">
            <div className="overview-name">Memory</div>
            <div className="overview-value">{memoryValue.toFixed(2)}%</div>
          </div>
        </div>
        <Sparkline data={memoryData} color="#8b5cf6" fillColor="rgba(139, 92, 246, 0.2)" />
      </div>

      {/* Disk Section */}
      <div className="overview-section">
        <div className="overview-header">
          <div className="overview-icon">💿</div>
          <div className="overview-info">
            <div className="overview-name">{diskName}</div>
            <div className="overview-subtitle">{diskType} (NVMe) {diskValue}%</div>
          </div>
        </div>
        <Sparkline data={diskData} color="#22c55e" fillColor="rgba(34, 197, 94, 0.2)" />
      </div>

      {/* WiFi Section */}
      <div className="overview-section">
        <div className="overview-header">
          <div className="overview-icon">📶</div>
          <div className="overview-info">
            <div className="overview-name">Wi-Fi</div>
            <div className="overview-subtitle">
              {wifiConnected ? `Connected (${wifiReceived} KB/s)` : 'Not Connected'}
            </div>
          </div>
        </div>
        <Sparkline data={wifiData} color="#ec4899" fillColor="rgba(236, 72, 153, 0.2)" />
      </div>

      {/* GPU 0 Section */}
      <div className="overview-section">
        <div className="overview-header">
          <div className="overview-icon">🎮</div>
          <div className="overview-info">
            <div className="overview-name">GPU 0</div>
            <div className="overview-subtitle">{gpu0Name}</div>
            <div className="overview-value">{gpu0Usage}%</div>
          </div>
        </div>
        <Sparkline data={gpu0Data} color="#06b6d4" fillColor="rgba(6, 182, 212, 0.2)" />
      </div>

      {/* GPU 1 Section */}
      <div className="overview-section">
        <div className="overview-header">
          <div className="overview-icon">🎮</div>
          <div className="overview-info">
            <div className="overview-name">GPU 1</div>
            <div className="overview-subtitle">{gpu1Name}</div>
            <div className="overview-value">{gpu1Usage}% {gpu1Temp > 0 && `(${gpu1Temp}°C)`}</div>
          </div>
        </div>
        <Sparkline data={gpu1Data} color="#f59e0b" fillColor="rgba(245, 158, 11, 0.2)" />
      </div>
    </div>
  );
});

export default SystemOverviewPanel;
