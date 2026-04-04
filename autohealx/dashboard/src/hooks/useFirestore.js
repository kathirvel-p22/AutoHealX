// ============================================================
// AutoHealX — useFirestore Hook
// Real-time Firebase listeners for dashboard data
// Falls back to localStorage if Firebase not configured
// ============================================================

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';

const isFirebaseConfigured = () => {
  return false; // Always use localStorage fallback for now
};

// LocalStorage-based fallback using localStorage API
// (Dashboard and Agent share data via localStorage sync)
const LOCAL_STORAGE_KEYS = {
  metrics: 'autohealx_metrics',
  alerts: 'autohealx_alerts',
  fixLogs: 'autohealx_fixlogs',
  agentStatus: 'autohealx_agentStatus',
  knowledge: 'autohealx_knowledge'
};

function loadFromLocalStorage(key, defaultValue) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

/**
 * Listen to real-time system metrics
 */
export function useMetrics(limitCount = 30) {
  const [metrics, setMetrics] = useState([]);
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      // Use localStorage fallback
      const stored = loadFromLocalStorage(LOCAL_STORAGE_KEYS.metrics, []);
      const data = stored.slice(-limitCount).reverse();
      setMetrics(data);
      if (data.length > 0) setLatest(data[data.length - 1]);
      
      // Listen for storage events from other tabs
      const handler = (e) => {
        if (e.key === LOCAL_STORAGE_KEYS.metrics) {
          const newData = e.newValue ? JSON.parse(e.newValue) : [];
          const reversed = newData.slice(-limitCount).reverse();
          setMetrics(reversed);
          if (reversed.length > 0) setLatest(reversed[reversed.length - 1]);
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }

    const q = query(
      collection(db, 'metrics'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .reverse();
      setMetrics(data);
      if (data.length > 0) setLatest(data[data.length - 1]);
    });

    return () => unsub();
  }, [limitCount]);

  return { metrics, latest };
}

/**
 * Listen to real-time alerts
 */
export function useAlerts(limitCount = 20) {
  const [alerts, setAlerts] = useState([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      const stored = loadFromLocalStorage(LOCAL_STORAGE_KEYS.alerts, []);
      setAlerts(stored.slice(0, limitCount));
      setUnresolvedCount(stored.filter(a => !a.resolved).length);
      
      const handler = (e) => {
        if (e.key === LOCAL_STORAGE_KEYS.alerts) {
          const newData = e.newValue ? JSON.parse(e.newValue) : [];
          setAlerts(newData.slice(0, limitCount));
          setUnresolvedCount(newData.filter(a => !a.resolved).length);
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }

    const q = query(
      collection(db, 'alerts'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAlerts(data);
      setUnresolvedCount(data.filter(a => !a.resolved).length);
    });

    return () => unsub();
  }, [limitCount]);

  return { alerts, unresolvedCount };
}

/**
 * Listen to fix logs
 */
export function useFixLogs(limitCount = 20) {
  const [fixLogs, setFixLogs] = useState([]);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      const stored = loadFromLocalStorage(LOCAL_STORAGE_KEYS.fixLogs, []);
      setFixLogs(stored.slice(0, limitCount));
      
      const handler = (e) => {
        if (e.key === LOCAL_STORAGE_KEYS.fixLogs) {
          const newData = e.newValue ? JSON.parse(e.newValue) : [];
          setFixLogs(newData.slice(0, limitCount));
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }

    const q = query(
      collection(db, 'fixlogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFixLogs(data);
    });

    return () => unsub();
  }, [limitCount]);

  return { fixLogs };
}

/**
 * Listen to agent status
 */
export function useAgentStatus() {
  const [agentStatus, setAgentStatus] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      const stored = loadFromLocalStorage(LOCAL_STORAGE_KEYS.agentStatus, null);
      setAgentStatus(stored);
      
      const handler = (e) => {
        if (e.key === LOCAL_STORAGE_KEYS.agentStatus) {
          setAgentStatus(e.newValue ? JSON.parse(e.newValue) : null);
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }

    const unsub = onSnapshot(doc(db, 'agentStatus', 'current'), (snap) => {
      if (snap.exists()) {
        setAgentStatus({ id: snap.id, ...snap.data() });
      }
    });

    return () => unsub();
  }, []);

  return { agentStatus };
}

/**
 * Listen to pending actions (for approval system)
 */
export function usePendingActions() {
  const [pendingActions, setPendingActions] = useState([]);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      const stored = loadFromLocalStorage('autohealx_pendingActions', []);
      setPendingActions(stored.filter(a => a.status === 'pending'));
      
      const handler = (e) => {
        if (e.key === 'autohealx_pendingActions') {
          const newData = e.newValue ? JSON.parse(e.newValue) : [];
          setPendingActions(newData.filter(a => a.status === 'pending'));
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }

    const q = query(
      collection(db, 'pendingActions'),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(a => a.status === 'pending');
      setPendingActions(data);
    });

    return () => unsub();
  }, []);

  return { pendingActions };
}
