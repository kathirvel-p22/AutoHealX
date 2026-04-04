// ============================================================
// AutoHealX — Firebase Client Config (Dashboard)
// Replace with your Firebase web app config
// Get from: Firebase Console → Project Settings → Web App
// ============================================================

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ============================================================
// Firebase Functions for Agent Control
// ============================================================

/**
 * Update agent configuration
 */
export async function updateAgentConfig(config) {
  try {
    // For now, use localStorage as fallback
    localStorage.setItem('autohealx_agentConfig', JSON.stringify({
      ...config,
      timestamp: Date.now()
    }));
    
    // TODO: When Firebase is configured, use:
    // await setDoc(doc(db, 'agentConfig', 'current'), config);
    
    return true;
  } catch (error) {
    console.error('Failed to update agent config:', error);
    return false;
  }
}

/**
 * Approve a pending action
 */
export async function approveAction(actionId, reasoning) {
  try {
    // Create signal file for agent
    const signalData = {
      actionId,
      type: 'approve',
      reasoning,
      timestamp: Date.now()
    };
    
    // Try to write to agent config directory
    try {
      const response = await fetch('/api/agent-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signalData)
      });
      
      if (!response.ok) throw new Error('API call failed');
    } catch (apiError) {
      // Fallback: use localStorage and hope agent can read it
      localStorage.setItem('autohealx_actionSignal', JSON.stringify(signalData));
    }
    
    // Update pending actions
    const stored = JSON.parse(localStorage.getItem('autohealx_pendingActions') || '[]');
    const updated = stored.map(action => 
      action.id === actionId 
        ? { ...action, status: 'approved', reasoning, approvedAt: Date.now() }
        : action
    );
    localStorage.setItem('autohealx_pendingActions', JSON.stringify(updated));
    
    return true;
  } catch (error) {
    console.error('Failed to approve action:', error);
    return false;
  }
}

/**
 * Reject a pending action
 */
export async function rejectAction(actionId, reasoning) {
  try {
    // Create signal file for agent
    const signalData = {
      actionId,
      type: 'reject',
      reasoning,
      timestamp: Date.now()
    };
    
    // Try to write to agent config directory
    try {
      const response = await fetch('/api/agent-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signalData)
      });
      
      if (!response.ok) throw new Error('API call failed');
    } catch (apiError) {
      // Fallback: use localStorage
      localStorage.setItem('autohealx_actionSignal', JSON.stringify(signalData));
    }
    
    // Update pending actions
    const stored = JSON.parse(localStorage.getItem('autohealx_pendingActions') || '[]');
    const updated = stored.map(action => 
      action.id === actionId 
        ? { ...action, status: 'rejected', reasoning, rejectedAt: Date.now() }
        : action
    );
    localStorage.setItem('autohealx_pendingActions', JSON.stringify(updated));
    
    return true;
  } catch (error) {
    console.error('Failed to reject action:', error);
    return false;
  }
}

export default app;
