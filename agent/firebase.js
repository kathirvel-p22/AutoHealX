// ============================================================
// AutoHealX — Enhanced Firebase Admin (Agent Side)
// Writes metrics, alerts, and fix logs to Firestore
// Falls back to bridge system when Firebase not configured
// ============================================================

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const bridgeSystem = require('./bridgeSystem');

let initialized = false;
let useLocalStorage = false;

// localStorage file path for fallback
const LOCAL_STORAGE_FILE = path.join(__dirname, '../config/localData.json');

function ensureConfigDir() {
  const configDir = path.dirname(LOCAL_STORAGE_FILE);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

function loadLocalData() {
  try {
    ensureConfigDir();
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_STORAGE_FILE, 'utf8'));
    }
  } catch (err) {
    console.warn('[LocalStorage] Failed to load:', err.message);
  }
  return { metrics: [], alerts: [], fixlogs: [], agentStatus: {} };
}

function saveLocalData(data) {
  try {
    ensureConfigDir();
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn('[LocalStorage] Failed to save:', err.message);
  }
}

function initFirebase() {
  if (initialized) return;

  // Option 1: Use service account JSON file
  const serviceAccountPath = '../config/serviceAccountKey.json';

  let hasServiceAccount = false;
  try {
    const serviceAccount = require(serviceAccountPath);
    if (serviceAccount && serviceAccount.project_id) {
      hasServiceAccount = true;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      initialized = true;
      useLocalStorage = false;
      console.log('[Firebase] ✅ Initialized with service account');
      return;
    }
  } catch (err) {
    // Service account not found or invalid
  }

  // Option 2: Check for environment variables
  if (process.env.FIREBASE_PROJECT_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      initialized = true;
      useLocalStorage = false;
      console.log('[Firebase] ✅ Initialized with application default');
      return;
    } catch (e) {
      // Application default credentials not available
    }
  }

  // Fallback to localStorage
  console.warn('[Firebase] ❌ No Firebase config found, using localStorage fallback');
  useLocalStorage = true;
  initialized = true;
}

/**
 * Write system metrics to Firestore
 */
async function writeMetrics(metrics) {
  if (useLocalStorage) {
    try {
      const metricsWithTimestamp = { ...metrics, timestamp: new Date().toISOString() };
      
      // Write to dashboard public folder
      const dashboardPublicPath = path.join(__dirname, '../dashboard/public/metrics.json');
      try {
        let existingMetrics = [];
        if (fs.existsSync(dashboardPublicPath)) {
          existingMetrics = JSON.parse(fs.readFileSync(dashboardPublicPath, 'utf8'));
        }
        existingMetrics.push(metricsWithTimestamp);
        // Keep only last 100 metrics
        if (existingMetrics.length > 100) {
          existingMetrics = existingMetrics.slice(-100);
        }
        fs.writeFileSync(dashboardPublicPath, JSON.stringify(existingMetrics, null, 2));
      } catch (err) {
        console.warn('Could not write metrics to dashboard public folder:', err.message);
      }
      
      // Also maintain local file for backward compatibility
      const data = loadLocalData();
      data.metrics.push(metricsWithTimestamp);
      if (data.metrics.length > 200) {
        data.metrics = data.metrics.slice(-200);
      }
      saveLocalData(data);
    } catch (err) {
      console.error('[LocalStorage] writeMetrics error:', err.message);
    }
    return;
  }

  try {
    const db = admin.firestore();
    await db.collection('metrics').add({
      ...metrics,
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('[Firebase] writeMetrics error:', err.message);
  }
}

/**
 * Write a detected alert to Firestore
 */
async function writeAlert(alert) {
  if (useLocalStorage) {
    try {
      const alertWithId = { 
        ...alert, 
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        resolved: false, 
        timestamp: new Date().toISOString() 
      };
      
      bridgeSystem.writeAlert(alertWithId);
      bridgeSystem.syncToDashboard();
      
      // Also maintain local file
      const data = loadLocalData();
      data.alerts.push(alertWithId);
      if (data.alerts.length > 100) {
        data.alerts = data.alerts.slice(-100);
      }
      saveLocalData(data);
    } catch (err) {
      console.error('[LocalStorage] writeAlert error:', err.message);
    }
    return;
  }

  try {
    const db = admin.firestore();
    await db.collection('alerts').add({
      ...alert,
      resolved: false,
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('[Firebase] writeAlert error:', err.message);
  }
}

/**
 * Write a fix log entry to Firestore
 */
async function writeFixLog(log) {
  if (useLocalStorage) {
    try {
      const logWithId = { 
        ...log, 
        id: `fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString() 
      };
      
      bridgeSystem.writeFixLog(logWithId);
      bridgeSystem.syncToDashboard();
      
      // Also maintain local file
      const data = loadLocalData();
      data.fixlogs.push(logWithId);
      if (data.fixlogs.length > 100) {
        data.fixlogs = data.fixlogs.slice(-100);
      }
      saveLocalData(data);
    } catch (err) {
      console.error('[LocalStorage] writeFixLog error:', err.message);
    }
    return;
  }

  try {
    const db = admin.firestore();
    await db.collection('fixlogs').add({
      ...log,
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('[Firebase] writeFixLog error:', err.message);
  }
}

/**
 * Write/update agent status
 */
async function writeAgentStatus(status) {
  if (useLocalStorage) {
    try {
      const statusWithTimestamp = { 
        ...status, 
        lastHeartbeat: new Date().toISOString(),
        timestamp: Date.now()
      };
      
      // Write to dashboard public folder for direct access (root)
      const dashboardPublicPath = path.join(__dirname, '../dashboard/public/agent-status.json');
      try {
        fs.writeFileSync(dashboardPublicPath, JSON.stringify(statusWithTimestamp, null, 2));
      } catch (err) {
        console.warn('Could not write to dashboard public folder:', err.message);
      }
      
      // ALSO write to data directory (for consistency)
      const dashboardDataPath = path.join(__dirname, '../dashboard/public/data/agentStatus.json');
      try {
        // Ensure data directory exists
        const dataDir = path.dirname(dashboardDataPath);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(dashboardDataPath, JSON.stringify(statusWithTimestamp, null, 2));
      } catch (err) {
        console.warn('Could not write to dashboard data folder:', err.message);
      }
      
      // Also maintain local file
      const data = loadLocalData();
      data.agentStatus = statusWithTimestamp;
      saveLocalData(data);
    } catch (err) {
      console.error('[LocalStorage] writeAgentStatus error:', err.message);
    }
    return;
  }

  try {
    const db = admin.firestore();
    await db.collection('agentStatus').doc('current').set({
      ...status,
      lastHeartbeat: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('[Firebase] writeAgentStatus error:', err.message);
  }
}

/**
 * Mark an alert as resolved
 */
async function resolveAlert(alertId) {
  if (useLocalStorage) {
    try {
      const data = loadLocalData();
      const idx = data.alerts.findIndex(a => a.id === alertId);
      if (idx !== -1) {
        data.alerts[idx].resolved = true;
        data.alerts[idx].resolvedAt = new Date().toISOString();
        saveLocalData(data);
      }
    } catch (err) {
      console.error('[LocalStorage] resolveAlert error:', err.message);
    }
    return;
  }

  try {
    const db = admin.firestore();
    await db.collection('alerts').doc(alertId).update({
      resolved: true,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('[Firebase] resolveAlert error:', err.message);
  }
}

module.exports = {
  initFirebase,
  writeMetrics,
  writeAlert,
  writeFixLog,
  writeAgentStatus,
  resolveAlert,
  admin,
  isUseLocalStorage: () => useLocalStorage
};
