// ============================================================
// AutoHealX — Knowledge Base Panel Component
// ============================================================

import React from 'react';

export default function KnowledgePanel({ knowledge }) {
  if (!knowledge || knowledge.length === 0) {
    return (
      <div className="panel">
        <h3 className="panel-title">🧠 Knowledge Base</h3>
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>Learning from your system — knowledge builds over time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3 className="panel-title">
        🧠 Knowledge Base
        <span className="badge badge-purple">{knowledge.length} patterns learned</span>
      </h3>
      <div className="knowledge-grid">
        {knowledge.map(k => (
          <div key={k.id} className="knowledge-card">
            <div className="knowledge-header">
              <span className="knowledge-type">{k.issueType?.replace(/_/g, ' ')}</span>
              <span className="knowledge-rate" style={{
                color: k.successRate >= 80 ? '#22c55e' : k.successRate >= 50 ? '#f59e0b' : '#ef4444'
              }}>
                {k.successRate}%
              </span>
            </div>
            <div className="knowledge-fix">
              Best Fix: <strong>{k.bestFix?.replace(/_/g, ' ')}</strong>
            </div>
            <div className="knowledge-stats">
              <span>{k.count} attempts</span>
              <span>{k.successes} successes</span>
            </div>
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{
                  width: `${k.successRate}%`,
                  background: k.successRate >= 80 ? '#22c55e' : k.successRate >= 50 ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
