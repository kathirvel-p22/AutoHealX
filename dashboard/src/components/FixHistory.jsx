// ============================================================
// AutoHealX — Fix History Component
// ============================================================

import React from 'react';
import { format } from 'date-fns';

export default function FixHistory({ fixLogs }) {
  if (!fixLogs || fixLogs.length === 0) {
    return (
      <div className="panel">
        <h3 className="panel-title">🔧 Fix History</h3>
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No fixes executed yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3 className="panel-title">
        🔧 Fix History
        <span className="badge badge-blue">{fixLogs.length} entries</span>
      </h3>
      <div className="fix-list">
        {fixLogs.map(log => (
          <div key={log.id} className="fix-item">
            <div className="fix-status-dot" style={{
              background: log.skipped ? '#64748b' : log.success ? '#22c55e' : '#ef4444'
            }} />
            <div className="fix-content">
              <div className="fix-header">
                <span className="fix-issue">{log.issueType?.replace(/_/g, ' ')}</span>
                <span className={`fix-result ${log.skipped ? 'skipped' : log.success ? 'success' : 'failed'}`}>
                  {log.skipped ? 'SUGGESTED' : log.success ? 'FIXED ✓' : 'FAILED ✗'}
                </span>
              </div>
              <p className="fix-message">{log.message}</p>
              <div className="fix-meta">
                <span className="fix-action">{log.action?.replace(/_/g, ' ')}</span>
                <span className="fix-mode mode-badge">{log.mode?.toUpperCase()}</span>
                <span className="fix-confidence">{log.confidence}% conf.</span>
                <span className="fix-time">
                  {log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss') : ''}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
