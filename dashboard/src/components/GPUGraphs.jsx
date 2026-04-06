// ============================================================
// AutoHealX — GPU Graphs Component
// Real-time GPU monitoring with detailed graphs for all GPUs
// ============================================================

import React, { useState, memo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';

const GPUGraphs = memo(function GPUGraphs({ latest, metrics }) {
  const [selectedGPU, setSelectedGPU] = useState(0);
  const [viewMode, setViewMode] = useState('usage'); // usage, temp, combined

  // Process GPU metrics data
  const processedData = metrics.map((metric, index) => {
    const gpu0 = metric.gpu?.[0];
    const gpu1 = metric.gpu?.[1];
    
    return {
      time: metric.timestamp ? format(new Date(metric.timestamp), 'HH:mm:ss') : `${index}`,
      fullTime: metric.timestamp ? new Date(metric.timestamp).toLocaleTimeString() : 'Unknown',
      gpu0Usage: gpu0?.usage || 0,
      gpu0Temp: gpu0?.temperature || 0,
      gpu0Memory: gpu0?.memory || 0,
      gpu1Usage: gpu1?.usage || 0,
      gpu1Temp: gpu1?.temperature || 0,
      gpu1Memory: gpu1?.memory || 0,
    };
  }).slice(-30);

  // Get GPU info from latest data or defaults
  const gpu0Info = latest?.gpu?.[0] || { 
    name: 'Intel(R) UHD Graphics', 
    usage: 0, 
    temperature: 0,
    memory: 0 
  };
  const gpu1Info = latest?.gpu?.[1] || { 
    name: 'NVIDIA GeForce RTX 2050', 
    usage: 0, 
    temperature: 51,
    memory: 0 
  };

  const gpus = [
    { id: 0, ...gpu0Info, displayName: 'GPU 0 - Intel UHD' },
    { id: 1, ...gpu1Info, displayName: 'GPU 1 - NVIDIA RTX' }
  ];

  // Custom tooltip for GPU graphs
  const GPUTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="graph-tooltip-enhanced gpu-tooltip">
          <div className="tooltip-header">
            <strong>{payload[0]?.payload?.fullTime || label}</strong>
          </div>
          <div className="tooltip-content">
            {payload.map((entry, index) => (
              <div key={index} className="tooltip-row" style={{ color: entry.color }}>
                <span className="tooltip-label">{entry.name}:</span>
                <span className="tooltip-value">
                  {entry.value?.toFixed(1) || 0}{entry.name.includes('Temp') ? '°C' : '%'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate GPU stats
  const getGPUStats = (gpuId) => {
    const stats = { avg: 0, max: 0, current: 0, avgTemp: 0, maxTemp: 0 };
    const keyPrefix = gpuId === 0 ? 'gpu0' : 'gpu1';
    
    if (processedData.length > 0) {
      const usages = processedData.map(d => d[`${keyPrefix}Usage`]);
      const temps = processedData.map(d => d[`${keyPrefix}Temp`]);
      
      stats.avg = usages.reduce((a, b) => a + b, 0) / usages.length;
      stats.max = Math.max(...usages);
      stats.current = usages[usages.length - 1] || 0;
      
      stats.avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      stats.maxTemp = Math.max(...temps);
    }
    
    return stats;
  };

  return (
    <div className="gpu-graphs-container">
      <div className="gpu-graphs-header">
        <h3>🎮 GPU Monitoring</h3>
        <div className="gpu-controls">
          <div className="gpu-selector">
            {gpus.map((gpu, index) => (
              <button
                key={gpu.id}
                className={`gpu-select-btn ${selectedGPU === index ? 'active' : ''}`}
                onClick={() => setSelectedGPU(index)}
              >
                {gpu.displayName}
              </button>
            ))}
          </div>
          <div className="view-mode-toggle">
            <button 
              className={`mode-btn ${viewMode === 'usage' ? 'active' : ''}`}
              onClick={() => setViewMode('usage')}
            >
              Usage
            </button>
            <button 
              className={`mode-btn ${viewMode === 'temp' ? 'active' : ''}`}
              onClick={() => setViewMode('temp')}
            >
              Temp
            </button>
            <button 
              className={`mode-btn ${viewMode === 'combined' ? 'active' : ''}`}
              onClick={() => setViewMode('combined')}
            >
              Both
            </button>
          </div>
        </div>
      </div>

      {/* GPU Cards */}
      <div className="gpu-cards">
        {gpus.map((gpu, index) => {
          const stats = getGPUStats(index);
          const isSelected = selectedGPU === index;
          
          return (
            <div 
              key={gpu.id} 
              className={`gpu-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedGPU(index)}
            >
              <div className="gpu-card-header">
                <div className="gpu-card-icon">🎮</div>
                <div className="gpu-card-title">
                  <div className="gpu-name">{gpu.displayName}</div>
                  <div className="gpu-vendor">{gpu.name}</div>
                </div>
              </div>
              <div className="gpu-card-stats">
                <div className="gpu-stat">
                  <span className="stat-label">Usage</span>
                  <span className={`stat-value ${stats.current > 80 ? 'high' : stats.current > 50 ? 'medium' : 'low'}`}>
                    {stats.current.toFixed(0)}%
                  </span>
                </div>
                <div className="gpu-stat">
                  <span className="stat-label">Temp</span>
                  <span className={`stat-value ${stats.current > 0 && stats.avgTemp > 80 ? 'high' : stats.current > 0 && stats.avgTemp > 65 ? 'medium' : 'low'}`}>
                    {stats.avgTemp.toFixed(0)}°C
                  </span>
                </div>
                <div className="gpu-stat">
                  <span className="stat-label">Peak</span>
                  <span className="stat-value peak">{stats.max.toFixed(0)}%</span>
                </div>
              </div>
              {/* Mini usage bar */}
              <div className="gpu-usage-bar-container">
                <div 
                  className="gpu-usage-bar" 
                  style={{ 
                    width: `${Math.min(stats.current, 100)}%`,
                    background: stats.current > 80 ? '#ef4444' : stats.current > 50 ? '#f59e0b' : '#22c55e'
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* GPU Graph */}
      <div className="gpu-graph-content">
        <h4>
          {viewMode === 'usage' && `📊 ${gpus[selectedGPU].displayName} - Usage History`}
          {viewMode === 'temp' && `🌡️ ${gpus[selectedGPU].displayName} - Temperature History`}
          {viewMode === 'combined' && `📈 ${gpus[selectedGPU].displayName} - Combined Metrics`}
        </h4>
        
        <ResponsiveContainer width="100%" height={220}>
          {viewMode === 'combined' ? (
            <LineChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
              <Tooltip content={<GPUTooltip />} />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey={selectedGPU === 0 ? 'gpu0Usage' : 'gpu1Usage'} 
                name="Usage %" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey={selectedGPU === 0 ? 'gpu0Temp' : 'gpu1Temp'} 
                name="Temp °C" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          ) : (
            <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={viewMode === 'usage' ? '#f59e0b' : '#ef4444'} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={viewMode === 'usage' ? '#f59e0b' : '#ef4444'} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
              <Tooltip content={<GPUTooltip />} />
              <Area 
                type="monotone" 
                dataKey={selectedGPU === 0 
                  ? (viewMode === 'usage' ? 'gpu0Usage' : 'gpu0Temp')
                  : (viewMode === 'usage' ? 'gpu1Usage' : 'gpu1Temp')
                } 
                name={viewMode === 'usage' ? 'Usage %' : 'Temperature °C'}
                stroke={viewMode === 'usage' ? '#f59e0b' : '#ef4444'}
                fill="url(#gpuGradient)" 
                strokeWidth={2}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Compare GPUs */}
      <div className="gpu-compare-section">
        <h4>🔄 GPU Comparison</h4>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={[
            { name: 'Current', gpu0: getGPUStats(0).current, gpu1: getGPUStats(1).current },
            { name: 'Average', gpu0: getGPUStats(0).avg, gpu1: getGPUStats(1).avg },
            { name: 'Peak', gpu0: getGPUStats(0).max, gpu1: getGPUStats(1).max },
          ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip content={<GPUTooltip />} />
            <Legend />
            <Bar dataKey="gpu0" name="GPU 0 - Intel" fill="#06b6d4" />
            <Bar dataKey="gpu1" name="GPU 1 - NVIDIA" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default GPUGraphs;
