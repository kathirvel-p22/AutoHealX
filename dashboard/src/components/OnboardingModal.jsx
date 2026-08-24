// ============================================================
// AutoHealX — User Onboarding & Permission System
// ============================================================

import React, { useState } from 'react';

export default function OnboardingModal({ isOpen, onComplete }) {
  const [step, setStep] = useState(1);
  const [permissions, setPermissions] = useState({
    monitoring: false,
    autoFix: false,
    mode: 'suggestion' // 'suggestion' or 'auto'
  });

  if (!isOpen) return null;

  const handlePermissionChange = (key, value) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  const handleComplete = () => {
    onComplete(permissions);
  };

  return (
    <div className="modal-overlay">
      <div className="onboarding-modal">
        
        {/* Step 1: Welcome & Permissions */}
        {step === 1 && (
          <div className="onboarding-step">
            <div className="step-header">
              <div className="step-icon">🛡️</div>
              <h2>Welcome to AutoHealX</h2>
              <p>Intelligent System Protection & Self-Healing</p>
            </div>

            <div className="permission-card">
              <h3>🛡️ AutoHealX wants to monitor and protect your system</h3>
              
              <div className="permission-list">
                <div className="permission-item">
                  <span>📊</span>
                  <div>
                    <strong>Track CPU, Memory, Processes</strong>
                    <p>Monitor system metrics every 3 seconds</p>
                  </div>
                  <span className="check-icon">✅</span>
                </div>

                <div className="permission-item">
                  <span>⚠️</span>
                  <div>
                    <strong>Detect System Anomalies</strong>
                    <p>Use rule-based logic + trend analysis</p>
                  </div>
                  <span className="check-icon">✅</span>
                </div>

                <div className="permission-item">
                  <span>⚡</span>
                  <div>
                    <strong>Suggest or Apply Automatic Fixes</strong>
                    <p>Resolve issues to prevent system crashes</p>
                  </div>
                  <span className="check-icon">✅</span>
                </div>
              </div>

              <div className="permission-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={permissions.monitoring}
                    onChange={(e) => handlePermissionChange('monitoring', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span>Allow AutoHealX to monitor my device</span>
                </label>
              </div>

              <div className="security-note">
                <h4>🔐 Security Promise</h4>
                <ul>
                  <li>✅ No personal files or documents accessed</li>
                  <li>✅ Only system metrics monitored</li>
                  <li>✅ User controls all actions</li>
                  <li>✅ Agent runs locally on your device</li>
                </ul>
              </div>
            </div>

            <div className="step-actions">
              <button 
                className="btn-secondary"
                onClick={() => onComplete(null)}
              >
                Deny
              </button>
              <button 
                className="btn-primary"
                disabled={!permissions.monitoring}
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Mode Selection */}
        {step === 2 && (
          <div className="onboarding-step">
            <div className="step-header">
              <div className="step-icon">⚡</div>
              <h2>Choose Protection Mode</h2>
              <p>How should AutoHealX handle system issues?</p>
            </div>

            <div className="mode-selection">
              <div 
                className={`mode-card ${permissions.mode === 'suggestion' ? 'selected' : ''}`}
                onClick={() => handlePermissionChange('mode', 'suggestion')}
              >
                <div className="mode-header">
                  <div className="mode-indicator suggestion"></div>
                  <h3>🟢 Suggestion Mode</h3>
                  <span className="mode-badge recommended">Recommended</span>
                </div>
                <p>Ask permission before any action</p>
                <ul>
                  <li>Detect issues and explain the problem</li>
                  <li>Suggest the best fix with confidence score</li>
                  <li>Wait for your approval before acting</li>
                  <li>Learn from your decisions</li>
                </ul>
              </div>

              <div 
                className={`mode-card ${permissions.mode === 'auto' ? 'selected' : ''}`}
                onClick={() => handlePermissionChange('mode', 'auto')}
              >
                <div className="mode-header">
                  <div className="mode-indicator auto"></div>
                  <h3>🔴 Auto-Heal Mode</h3>
                  <span className="mode-badge advanced">Advanced</span>
                </div>
                <p>Fix issues automatically within safe boundaries</p>
                <ul>
                  <li>Instantly resolve critical system issues</li>
                  <li>Execute pre-approved safe actions</li>
                  <li>Log all actions for audit trail</li>
                  <li>Notify you after fixes are applied</li>
                </ul>
              </div>
            </div>

            <div className="step-actions">
              <button 
                className="btn-secondary"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button 
                className="btn-primary"
                onClick={handleComplete}
              >
                Start Protection
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}