// ============================================================
// AutoHealX — Detection Engine
// Rule-based detection with severity levels and trend analysis
// ============================================================

// ─── Thresholds ────────────────────────────────────────────
const THRESHOLDS = {
  cpu: {
    warning: 75,
    critical: 90,
    sustained: 70,   // If sustained for N intervals
    sustainedCount: 3
  },
  memory: {
    warning: 75,
    critical: 88
  },
  processes: {
    maxTotal: 500
  }
};

// Rolling history for trend analysis
const history = {
  cpu: [],
  memory: [],
  maxHistory: 10
};

/**
 * Analyze metrics and return detected issues
 */
function detectIssues(metrics) {
  if (!metrics) return [];

  const issues = [];
  const { cpu, memory, processes } = metrics;

  // ── Update rolling history ──────────────────────────────
  history.cpu.push(cpu.usage);
  history.memory.push(memory.usedPercent);
  if (history.cpu.length > history.maxHistory) history.cpu.shift();
  if (history.memory.length > history.maxHistory) history.memory.shift();

  // ── CPU Analysis ────────────────────────────────────────
  if (cpu.usage >= THRESHOLDS.cpu.critical) {
    issues.push({
      type: 'HIGH_CPU',
      severity: 'critical',
      message: `CPU usage is critically high at ${cpu.usage}%`,
      value: cpu.usage,
      threshold: THRESHOLDS.cpu.critical,
      suggestedAction: 'KILL_TOP_CPU_PROCESS',
      confidence: calculateConfidence('HIGH_CPU', cpu.usage, THRESHOLDS.cpu.critical)
    });
  } else if (cpu.usage >= THRESHOLDS.cpu.warning) {
    issues.push({
      type: 'HIGH_CPU_WARNING',
      severity: 'warning',
      message: `CPU usage elevated at ${cpu.usage}%`,
      value: cpu.usage,
      threshold: THRESHOLDS.cpu.warning,
      suggestedAction: 'MONITOR',
      confidence: calculateConfidence('HIGH_CPU_WARNING', cpu.usage, THRESHOLDS.cpu.warning)
    });
  }

  // ── Sustained CPU check ─────────────────────────────────
  if (history.cpu.length >= THRESHOLDS.cpu.sustainedCount) {
    const recent = history.cpu.slice(-THRESHOLDS.cpu.sustainedCount);
    const allSustained = recent.every(v => v >= THRESHOLDS.cpu.sustained);
    if (allSustained && cpu.usage < THRESHOLDS.cpu.critical) {
      issues.push({
        type: 'SUSTAINED_HIGH_CPU',
        severity: 'warning',
        message: `CPU has been above ${THRESHOLDS.cpu.sustained}% for ${THRESHOLDS.cpu.sustainedCount}+ intervals`,
        value: cpu.usage,
        threshold: THRESHOLDS.cpu.sustained,
        suggestedAction: 'REDUCE_LOAD',
        confidence: 78
      });
    }
  }

  // ── Memory Analysis ─────────────────────────────────────
  if (memory.usedPercent >= THRESHOLDS.memory.critical) {
    issues.push({
      type: 'MEMORY_OVERLOAD',
      severity: 'critical',
      message: `Memory usage critically high at ${memory.usedPercent}% (${memory.used}MB / ${memory.total}MB)`,
      value: memory.usedPercent,
      threshold: THRESHOLDS.memory.critical,
      suggestedAction: 'KILL_TOP_MEMORY_PROCESS',
      confidence: calculateConfidence('MEMORY_OVERLOAD', memory.usedPercent, THRESHOLDS.memory.critical)
    });
  } else if (memory.usedPercent >= THRESHOLDS.memory.warning) {
    issues.push({
      type: 'MEMORY_WARNING',
      severity: 'warning',
      message: `Memory usage elevated at ${memory.usedPercent}%`,
      value: memory.usedPercent,
      threshold: THRESHOLDS.memory.warning,
      suggestedAction: 'CLEAR_CACHE',
      confidence: calculateConfidence('MEMORY_WARNING', memory.usedPercent, THRESHOLDS.memory.warning)
    });
  }

  // ── Memory Trend (Leak detection) ───────────────────────
  if (history.memory.length >= 5) {
    const trend = detectTrend(history.memory.slice(-5));
    if (trend === 'rising' && memory.usedPercent > 60) {
      issues.push({
        type: 'MEMORY_LEAK_SUSPECTED',
        severity: 'info',
        message: 'Memory usage is consistently rising — possible memory leak',
        value: memory.usedPercent,
        threshold: 60,
        suggestedAction: 'MONITOR_MEMORY',
        confidence: 65
      });
    }
  }

  // ── Process Count ────────────────────────────────────────
  if (processes.total > THRESHOLDS.processes.maxTotal) {
    issues.push({
      type: 'TOO_MANY_PROCESSES',
      severity: 'warning',
      message: `Unusual number of processes running: ${processes.total}`,
      value: processes.total,
      threshold: THRESHOLDS.processes.maxTotal,
      suggestedAction: 'REVIEW_PROCESSES',
      confidence: 72
    });
  }

  return issues;
}

/**
 * Detect if a trend is rising, falling, or stable
 */
function detectTrend(values) {
  if (values.length < 2) return 'stable';
  let rises = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) rises++;
  }
  const ratio = rises / (values.length - 1);
  if (ratio >= 0.7) return 'rising';
  if (ratio <= 0.3) return 'falling';
  return 'stable';
}

/**
 * Calculate fix confidence based on how far over threshold
 */
function calculateConfidence(type, value, threshold) {
  const overshoot = value - threshold;
  const base = 70;
  const bonus = Math.min(overshoot * 2, 28);
  return Math.round(base + bonus);
}

module.exports = { detectIssues, THRESHOLDS };
