// ============================================================
// AutoHealX — CPU & Memory Graph Component
// ============================================================

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '12px'
      }}>
        <p style={{ color: '#94a3b8', marginBottom: '4px' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: '2px 0' }}>
            {p.name}: <strong>{p.value.toFixed(1)}%</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MetricsGraph({ metrics }) {
  const chartData = metrics.map(m => ({
    time: m.timestamp ? format(new Date(m.timestamp), 'HH:mm:ss') : '',
    CPU: m.cpu,
    Memory: m.memory
  }));

  return (
    <div className="graph-container">
      <div className="graph-header">
        <h3 className="graph-title">
          <span className="graph-icon">📈</span>
          Real-Time System Metrics
        </h3>
        <div className="graph-legend">
          <span className="legend-dot cpu" /> CPU
          <span className="legend-dot mem" /> Memory
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="4 2" strokeOpacity={0.6} label={{ value: 'Critical', fill: '#ef4444', fontSize: 10 }} />
          <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.5} />
          <Area type="monotone" dataKey="CPU" stroke="#6366f1" strokeWidth={2} fill="url(#cpuGrad)" name="CPU" dot={false} />
          <Area type="monotone" dataKey="Memory" stroke="#06b6d4" strokeWidth={2} fill="url(#memGrad)" name="Memory" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
