// ============================================================
// AutoHealX — Alert Panel Component
// ============================================================

import React from 'react';
import { format } from 'date-fns';

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: '🔴', label: 'CRITICAL' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: '🟡', label: 'WARNING' },
  info:     { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)', icon: '🔵', label: 'INFO' }
};

export default function AlertPanel({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="panel">
        <h3 className="panel-title">⚠️ Active Alerts</h3>
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <p>All systems normal — no alerts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3 className="panel-title">
        ⚠️ Active Alerts
        <span className="badge badge-red">{alerts.filter(a => !a.resolved).length} active</span>
      </h3>
      <div className="alert-list">
        {alerts.map(alert => {
          const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
          return (
            <div key={alert.id} className="alert-item" style={{
              background: cfg.bg,
              borderLeft: `3px solid ${cfg.color}`,
              border: `1px solid ${cfg.border}`,
              borderLeftWidth: '3px'
            }}>
              <div className="alert-header">
                <span className="alert-icon">{cfg.icon}</span>
                <span className="alert-type" style={{ color: cfg.color }}>{alert.type?.replace(/_/g, ' ')}</span>
                <span className="alert-confidence">
                  {alert.confidence}% confidence
                </span>
                {alert.resolved && <span className="badge badge-green">Resolved</span>}
              </div>
              <p className="alert-message">{alert.message}</p>
              <div className="alert-footer">
                <span className="alert-action">→ {alert.suggestedAction?.replace(/_/g, ' ')}</span>
                <span className="alert-time">
                  {alert.timestamp ? format(new Date(alert.timestamp), 'HH:mm:ss') : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
