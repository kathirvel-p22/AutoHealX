// ============================================================
// AutoHealX — Action Approval Modal (Permission System)
// ============================================================

import React, { useState } from 'react';

export default function ActionApprovalModal({ action, onApprove, onReject, isOpen }) {
  const [reasoning, setReasoning] = useState('');

  if (!isOpen || !action) return null;

  const getActionIcon = () => {
    switch (action.type) {
      case 'HIGH_CPU': return <span className="action-icon cpu">🖥️</span>;
      case 'HIGH_MEMORY': return <span className="action-icon memory">💾</span>;
      default: return <span className="action-icon warning">⚠️</span>;
    }
  };

  const getActionColor = () => {
    switch (action.severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const handleApprove = () => {
    onApprove(action.id, reasoning);
    setReasoning('');
  };

  const handleReject = () => {
    onReject(action.id, reasoning);
    setReasoning('');
  };

  return (
    <div className="modal-overlay">
      <div className="approval-modal">
        
        {/* Header */}
        <div className="approval-header" style={{ '--accent': getActionColor() }}>
          {getActionIcon()}
          <div className="approval-title">
            <h2>⚠️ {action.severity?.toUpperCase()} System Issue Detected</h2>
            <p>AutoHealX needs your permission to proceed</p>
          </div>
          <button className="modal-close" onClick={() => onReject(action.id)}>
            ✕
          </button>
        </div>

        {/* Issue Details */}
        <div className="issue-details">
          <div className="detail-row">
            <span className="detail-label">Issue Type:</span>
            <span className="detail-value">{action.type}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Current Value:</span>
            <span className="detail-value critical">{action.currentValue}%</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Threshold:</span>
            <span className="detail-value">{action.threshold}%</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Confidence:</span>
            <span className="detail-value">{action.confidence}%</span>
          </div>
        </div>

        {/* Cause Analysis */}
        <div className="cause-analysis">
          <h3>🔍 Cause Analysis</h3>
          <div className="cause-card">
            <strong>Primary Cause:</strong> {action.cause || 'High resource consumption detected'}
            <br />
            <strong>Affected Process:</strong> {action.process || 'Multiple processes'}
            <br />
            <strong>Impact:</strong> {action.impact || 'System performance degradation'}
          </div>
        </div>

        {/* Suggested Fix */}
        <div className="suggested-fix">
          <h3>🔧 Suggested Fix</h3>
          <div className="fix-card">
            <div className="fix-action">
              <strong>Action:</strong> {action.suggestedAction}
            </div>
            <div className="fix-reason">
              <strong>Reason:</strong> {action.reason}
            </div>
            <div className="fix-expected">
              <strong>Expected Result:</strong> {action.expectedResult}
            </div>
          </div>
        </div>

        {/* Success Rate */}
        {action.successRate && (
          <div className="success-rate">
            <h4>📊 Historical Success Rate</h4>
            <div className="success-bar">
              <div 
                className="success-fill" 
                style={{ width: `${action.successRate}%` }}
              ></div>
              <span className="success-text">{action.successRate}% Success Rate</span>
            </div>
          </div>
        )}

        {/* User Input */}
        <div className="user-input">
          <label htmlFor="reasoning">Add your reasoning (optional):</label>
          <textarea
            id="reasoning"
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder="Why are you approving/rejecting this action?"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="approval-actions">
          <button 
            className="btn-reject"
            onClick={handleReject}
          >
            <span>❌</span>
            Reject
          </button>
          <button 
            className="btn-approve"
            onClick={handleApprove}
          >
            <span>✅</span>
            Approve & Execute
          </button>
        </div>

        {/* Warning */}
        <div className="approval-warning">
          <span>⚠️</span>
          <span>This action will be executed immediately after approval</span>
        </div>

      </div>
    </div>
  );
}