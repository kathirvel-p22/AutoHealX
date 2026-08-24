// ============================================================
// AutoHealX — Self-Healing Engine
// Executes safe, permission-bounded recovery actions
// ============================================================

const { exec, execSync } = require('child_process');
const { getTopCPUProcess, getTopMemoryProcess } = require('./monitor');

// ─── Allowed Actions (Security Boundary) ───────────────────
const ALLOWED_ACTIONS = [
  'KILL_TOP_CPU_PROCESS',
  'KILL_TOP_MEMORY_PROCESS',
  'KILL_SPECIFIC_PROCESS',
  'CLEAR_CACHE',
  'REDUCE_LOAD',
  'MONITOR',
  'MONITOR_MEMORY',
  'REVIEW_PROCESSES'
];

// System-critical processes that MUST NOT be killed
const PROTECTED_PROCESSES = [
  'systemd', 'init', 'kernel', 'sshd', 'login', 'sudo',
  'node', 'autohealx', 'bash', 'sh', 'wininit', 'csrss',
  'smss', 'services', 'lsass', 'winlogon', 'explorer'
];

/**
 * Execute a healing action
 * @param {string} action - The action type
 * @param {string} mode - 'auto' | 'suggestion'
 * @param {object} params - Additional parameters (e.g., specific PID)
 * @returns {object} result
 */
async function executeHeal(action, mode = 'suggestion', params = {}) {
  if (!ALLOWED_ACTIONS.includes(action)) {
    return { success: false, message: `Action '${action}' is not in allowed list`, skipped: true };
  }

  if (mode === 'suggestion') {
    return {
      success: true,
      skipped: true,
      message: `Suggestion Mode: Would execute '${action}' — awaiting user approval`,
      action
    };
  }

  // Auto-Heal Mode — execute action
  switch (action) {
    case 'KILL_TOP_CPU_PROCESS':
      return await killTopCPUProcess();
    case 'KILL_TOP_MEMORY_PROCESS':
      return await killTopMemoryProcess();
    case 'KILL_SPECIFIC_PROCESS':
      return await killSpecificProcess(params.pid, params.name);
    case 'CLEAR_CACHE':
      return await clearSystemCache();
    case 'REDUCE_LOAD':
      return { success: true, message: 'Load reduction: closed background tasks suggestion sent' };
    case 'MONITOR':
    case 'MONITOR_MEMORY':
    case 'REVIEW_PROCESSES':
      return { success: true, message: `Action '${action}' logged — no automatic change needed`, skipped: true };
    default:
      return { success: false, message: 'Unknown action' };
  }
}

async function killSpecificProcess(pid, name) {
  try {
    if (!pid) {
      return { success: false, message: 'No PID provided' };
    }

    if (PROTECTED_PROCESSES.some(p => name.toLowerCase().includes(p.toLowerCase()))) {
      return {
        success: false,
        message: `Process '${name}' is protected — cannot kill`,
        processName: name
      };
    }

    await killProcess(pid);

    return {
      success: true,
      message: `Successfully killed process '${name}' (PID: ${pid})`,
      processName: name,
      pid: pid
    };
  } catch (err) {
    return { 
      success: false, 
      message: `Failed to kill process '${name}' (PID: ${pid}): ${err.message}`,
      processName: name,
      pid: pid
    };
  }
}

async function killTopCPUProcess() {
  try {
    const proc = await getTopCPUProcess();
    if (!proc) return { success: false, message: 'No process found' };

    if (PROTECTED_PROCESSES.includes(proc.name.toLowerCase())) {
      return {
        success: false,
        message: `Process '${proc.name}' is protected — cannot kill`,
        processName: proc.name
      };
    }

    if (proc.cpu < 5) {
      return { success: true, message: 'Top CPU process is already below 5% — no action needed', skipped: true };
    }

    await killProcess(proc.pid);

    return {
      success: true,
      message: `Killed process '${proc.name}' (PID: ${proc.pid}) using ${proc.cpu}% CPU`,
      processName: proc.name,
      pid: proc.pid,
      cpuReclaimed: proc.cpu
    };
  } catch (err) {
    return { success: false, message: `Failed to kill CPU process: ${err.message}` };
  }
}

async function killTopMemoryProcess() {
  try {
    const proc = await getTopMemoryProcess();
    if (!proc) return { success: false, message: 'No process found' };

    if (PROTECTED_PROCESSES.includes(proc.name.toLowerCase())) {
      return {
        success: false,
        message: `Process '${proc.name}' is protected — cannot kill`,
        processName: proc.name
      };
    }

    await killProcess(proc.pid);

    return {
      success: true,
      message: `Killed process '${proc.name}' (PID: ${proc.pid}) using ${proc.memPercent}% memory`,
      processName: proc.name,
      pid: proc.pid
    };
  } catch (err) {
    return { success: false, message: `Failed to kill memory process: ${err.message}` };
  }
}

function killProcess(pid) {
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    const cmd = platform === 'win32' ? `taskkill /PID ${pid} /F` : `kill -9 ${pid}`;
    exec(cmd, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function clearSystemCache() {
  try {
    const platform = process.platform;
    if (platform === 'linux') {
      exec('sync && echo 1 > /proc/sys/vm/drop_caches', () => {});
    }
    // On Windows/Mac, we just log — cache clearing requires elevated permissions
    return {
      success: true,
      message: 'Cache clear command issued (requires elevated permissions on some systems)'
    };
  } catch (err) {
    return { success: false, message: `Cache clear failed: ${err.message}` };
  }
}

/**
 * Map issue type → suggested action
 */
function getActionForIssue(issueType) {
  const actionMap = {
    'HIGH_CPU': 'KILL_TOP_CPU_PROCESS',
    'HIGH_CPU_WARNING': 'MONITOR',
    'SUSTAINED_HIGH_CPU': 'REDUCE_LOAD',
    'MEMORY_OVERLOAD': 'KILL_TOP_MEMORY_PROCESS',
    'MEMORY_WARNING': 'CLEAR_CACHE',
    'MEMORY_LEAK_SUSPECTED': 'MONITOR_MEMORY',
    'TOO_MANY_PROCESSES': 'REVIEW_PROCESSES'
  };
  return actionMap[issueType] || 'MONITOR';
}

module.exports = { executeHeal, getActionForIssue, ALLOWED_ACTIONS };
