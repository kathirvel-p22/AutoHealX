// ============================================================
// AutoHealX — Knowledge Base
// Stores past issues/fixes and tracks success rates
// Falls back to localStorage when Firebase not configured
// ============================================================

const fs = require('fs');
const path = require('path');

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
    console.warn('[KnowledgeBase] Failed to load:', err.message);
  }
  return { knowledge: {} };
}

function saveLocalData(data) {
  try {
    ensureConfigDir();
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn('[KnowledgeBase] Failed to save:', err.message);
  }
}

function setUseLocalStorage(value) {
  useLocalStorage = value;
}

/**
 * Record a fix attempt in the knowledge base
 */
async function recordFix(issueType, action, success) {
  if (useLocalStorage) {
    try {
      const data = loadLocalData();
      if (!data.knowledge) data.knowledge = {};
      
      if (data.knowledge[issueType]) {
        const kb = data.knowledge[issueType];
        kb.count = (kb.count || 0) + 1;
        kb.successes = (kb.successes || 0) + (success ? 1 : 0);
        kb.successRate = parseFloat(((kb.successes / kb.count) * 100).toFixed(1));
        kb.lastAction = action;
        kb.lastAttempt = new Date().toISOString();
        kb.history = kb.history || [];
        kb.history.push({ action, success, timestamp: new Date().toISOString() });
      } else {
        data.knowledge[issueType] = {
          issueType,
          count: 1,
          successes: success ? 1 : 0,
          successRate: success ? 100 : 0,
          bestFix: action,
          lastAction: action,
          lastAttempt: new Date().toISOString(),
          history: [{ action, success, timestamp: new Date().toISOString() }]
        };
      }
      saveLocalData(data);
    } catch (err) {
      console.error('[KnowledgeBase] Failed to record fix:', err.message);
    }
    return;
  }

  try {
    const admin = require('firebase-admin');
    const db = admin.firestore();
    const ref = db.collection('knowledge').doc(issueType);
    const doc = await ref.get();

    if (doc.exists) {
      const data = doc.data();
      const newCount = data.count + 1;
      const newSuccesses = success ? data.successes + 1 : data.successes;
      const newRate = parseFloat(((newSuccesses / newCount) * 100).toFixed(1));

      await ref.update({
        count: newCount,
        successes: newSuccesses,
        successRate: newRate,
        lastAction: action,
        lastAttempt: new Date().toISOString(),
        history: admin.firestore.FieldValue.arrayUnion({
          action,
          success,
          timestamp: new Date().toISOString()
        })
      });
    } else {
      await ref.set({
        issueType,
        count: 1,
        successes: success ? 1 : 0,
        successRate: success ? 100 : 0,
        bestFix: action,
        lastAction: action,
        lastAttempt: new Date().toISOString(),
        history: [{ action, success, timestamp: new Date().toISOString() }]
      });
    }
  } catch (err) {
    console.error('[KnowledgeBase] Failed to record fix:', err.message);
  }
}

/**
 * Retrieve best known fix for an issue type
 */
async function getBestFix(issueType) {
  if (useLocalStorage) {
    try {
      const data = loadLocalData();
      return data.knowledge?.[issueType] || null;
    } catch (err) {
      console.error('[KnowledgeBase] Failed to get fix:', err.message);
      return null;
    }
  }

  try {
    const admin = require('firebase-admin');
    const db = admin.firestore();
    const doc = await db.collection('knowledge').doc(issueType).get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (err) {
    console.error('[KnowledgeBase] Failed to get fix:', err.message);
    return null;
  }
}

/**
 * Get summary of all known fixes
 */
async function getAllKnowledge() {
  if (useLocalStorage) {
    try {
      const data = loadLocalData();
      return data.knowledge ? Object.values(data.knowledge) : [];
    } catch (err) {
      console.error('[KnowledgeBase] Failed to get all knowledge:', err.message);
      return [];
    }
  }

  try {
    const admin = require('firebase-admin');
    const db = admin.firestore();
    const snap = await db.collection('knowledge').get();
    return snap.docs.map(d => d.data());
  } catch (err) {
    console.error('[KnowledgeBase] Failed to get all knowledge:', err.message);
    return [];
  }
}

module.exports = { recordFix, getBestFix, getAllKnowledge, setUseLocalStorage };
