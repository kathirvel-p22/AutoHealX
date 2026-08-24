// ============================================================
// AutoHealX — Advanced Detection Engine
// Rule-based + Trend Analysis + Confidence Scoring
// ============================================================

const fs = require('fs');
const path = require('path');

class AdvancedDetector {
  constructor() {
    this.history = [];
    this.maxHistory = 10;
    this.lastAlerts = new Map(); // Debouncing
    this.debounceTime = 30000; // 30 seconds
  }

  /**
   * Main detection function with advanced analysis
   */
  detectIssues(metrics) {
    const issues = [];
    const timestamp = Date.now();

    // Add to history for trend analysis
    this.addToHistory(metrics);

    // Rule-based detection
    const ruleIssues = this.detectRuleBasedIssues(metrics);
    issues.push(...ruleIssues);

    // Trend-based detection (advanced)
    const trendIssues = this.detectTrendIssues();
    issues.push(...trendIssues);

    // Filter debounced alerts
    const filteredIssues = this.filterDebounced(issues, timestamp);

    // Add confidence scores and explanations
    return filteredIssues.map(issue => this.enhanceIssue(issue, metrics));
  }

  /**
   * Rule-based detection logic
   */
  detectRuleBasedIssues(metrics) {
    const issues = [];
    const { cpu, memory, processCount, topCPUProcess, topMemoryProcess } = metrics;

    // CPU Rules
    if (cpu >= 95) {
      issues.push({
        type: 'CRITICAL_CPU',
        severity: 'critical',
        currentValue: cpu,
        threshold: 95,
        cause: `${topCPUProcess?.name || 'Unknown process'} consuming ${topCPUProcess?.cpu || 'high'}% CPU`,
        suggestedAction: `Terminate ${topCPUProcess?.name || 'high CPU process'}`,
        reason: 'System is at critical CPU usage, immediate action required to prevent freeze',
        expectedResult: `CPU usage should drop to ~${Math.max(20, cpu - (topCPUProcess?.cpu || 50))}%`,
        process: topCPUProcess?.name,
        impact: 'System freeze, application crashes, user experience degradation'
      });
    } else if (cpu >= 90) {
      issues.push({
        type: 'HIGH_CPU',
        severity: 'critical',
        currentValue: cpu,
        threshold: 90,
        cause: `${topCPUProcess?.name || 'Unknown process'} consuming excessive CPU`,
        suggestedAction: `Terminate ${topCPUProcess?.name || 'high CPU process'}`,
        reason: 'High CPU usage detected, terminating top consumer will stabilize system',
        expectedResult: 'CPU usage will reduce significantly, system responsiveness will improve',
        process: topCPUProcess?.name,
        impact: 'Slow system response, potential application hangs'
      });
    } else if (cpu >= 75) {
      issues.push({
        type: 'HIGH_CPU_WARNING',
        severity: 'warning',
        currentValue: cpu,
        threshold: 75,
        cause: 'Multiple processes or sustained high load',
        suggestedAction: 'Monitor CPU usage and consider closing unnecessary applications',
        reason: 'CPU usage is elevated, monitoring recommended to prevent escalation',
        expectedResult: 'Continued monitoring will help prevent critical CPU situations',
        impact: 'Reduced system performance, slower application response'
      });
    }

    // Memory Rules
    if (memory >= 95) {
      issues.push({
        type: 'CRITICAL_MEMORY',
        severity: 'critical',
        currentValue: memory,
        threshold: 95,
        cause: `${topMemoryProcess?.name || 'Unknown process'} consuming ${topMemoryProcess?.memory || 'high'}% memory`,
        suggestedAction: `Terminate ${topMemoryProcess?.name || 'high memory process'}`,
        reason: 'Critical memory usage, system may crash or become unresponsive',
        expectedResult: `Memory usage should drop to ~${Math.max(30, memory - (topMemoryProcess?.memory || 40))}%`,
        process: topMemoryProcess?.name,
        impact: 'System crash, data loss, application failures'
      });
    } else if (memory >= 88) {
      issues.push({
        type: 'MEMORY_OVERLOAD',
        severity: 'critical',
        currentValue: memory,
        threshold: 88,
        cause: `${topMemoryProcess?.name || 'Unknown process'} using excessive memory`,
        suggestedAction: `Terminate ${topMemoryProcess?.name || 'high memory process'}`,
        reason: 'Memory overload detected, freeing memory will prevent system instability',
        expectedResult: 'Available memory will increase, system stability will improve',
        process: topMemoryProcess?.name,
        impact: 'System slowdown, potential crashes'
      });
    } else if (memory >= 75) {
      issues.push({
        type: 'MEMORY_WARNING',
        severity: 'warning',
        currentValue: memory,
        threshold: 75,
        cause: 'High memory consumption across multiple processes',
        suggestedAction: 'Clear system cache and close unnecessary applications',
        reason: 'Memory usage is high, proactive cleanup recommended',
        expectedResult: 'Memory usage will decrease, system performance will improve',
        impact: 'Slower application loading, reduced multitasking capability'
      });
    }

    // Process Count Rules
    if (processCount > 500) {
      issues.push({
        type: 'TOO_MANY_PROCESSES',
        severity: 'warning',
        currentValue: processCount,
        threshold: 500,
        cause: 'Excessive number of running processes',
        suggestedAction: 'Review and terminate unnecessary processes',
        reason: 'Too many processes can consume system resources and slow performance',
        expectedResult: 'Reduced process count will improve system efficiency',
        impact: 'Resource fragmentation, slower system response'
      });
    }

    return issues;
  }

  /**
   * Advanced trend analysis
   */
  detectTrendIssues() {
    if (this.history.length < 5) return [];

    const issues = [];
    const recent = this.history.slice(-5);

    // CPU Trend Analysis
    const cpuTrend = this.analyzeTrend(recent.map(h => h.cpu));
    if (cpuTrend.isIncreasing && cpuTrend.slope > 5) {
      const lastCpu = recent[recent.length - 1].cpu;
      if (lastCpu > 70) {
        issues.push({
          type: 'SUSTAINED_HIGH_CPU',
          severity: 'warning',
          currentValue: lastCpu,
          threshold: 70,
          cause: `CPU usage increasing trend detected (${cpuTrend.slope.toFixed(1)}% per cycle)`,
          suggestedAction: 'Investigate processes causing sustained CPU load',
          reason: 'Increasing CPU trend may lead to system overload',
          expectedResult: 'Early intervention will prevent CPU critical situations',
          impact: 'Progressive system slowdown, potential future crashes',
          trend: cpuTrend
        });
      }
    }

    // Memory Trend Analysis (Memory Leak Detection)
    const memoryTrend = this.analyzeTrend(recent.map(h => h.memory));
    if (memoryTrend.isIncreasing && memoryTrend.slope > 3) {
      const lastMemory = recent[recent.length - 1].memory;
      if (lastMemory > 60) {
        issues.push({
          type: 'MEMORY_LEAK_SUSPECTED',
          severity: 'warning',
          currentValue: lastMemory,
          threshold: 60,
          cause: `Memory leak suspected (${memoryTrend.slope.toFixed(1)}% increase per cycle)`,
          suggestedAction: 'Monitor memory usage and identify leaking processes',
          reason: 'Consistent memory increase suggests potential memory leak',
          expectedResult: 'Early detection prevents memory exhaustion',
          impact: 'Progressive memory consumption, eventual system crash',
          trend: memoryTrend
        });
      }
    }

    return issues;
  }

  /**
   * Analyze trend in data points
   */
  analyzeTrend(values) {
    if (values.length < 3) return { isIncreasing: false, slope: 0 };

    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return {
      isIncreasing: slope > 0,
      slope: slope,
      confidence: Math.min(Math.abs(slope) * 10, 100) // Simple confidence metric
    };
  }

  /**
   * Add metrics to history for trend analysis
   */
  addToHistory(metrics) {
    this.history.push({
      ...metrics,
      timestamp: Date.now()
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Filter out debounced alerts (prevent spam)
   */
  filterDebounced(issues, timestamp) {
    return issues.filter(issue => {
      const key = `${issue.type}_${issue.process || 'general'}`;
      const lastAlert = this.lastAlerts.get(key);
      
      if (!lastAlert || (timestamp - lastAlert) > this.debounceTime) {
        this.lastAlerts.set(key, timestamp);
        return true;
      }
      
      return false;
    });
  }

  /**
   * Enhance issue with confidence score and additional data
   */
  enhanceIssue(issue, metrics) {
    // Calculate confidence score
    const confidence = this.calculateConfidence(issue, metrics);
    
    // Get success rate from knowledge base
    const successRate = this.getSuccessRate(issue.type);

    return {
      ...issue,
      id: `${issue.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      confidence,
      successRate,
      timestamp: Date.now(),
      status: 'pending'
    };
  }

  /**
   * Calculate confidence score for detection
   */
  calculateConfidence(issue, metrics) {
    let confidence = 50; // Base confidence

    // Severity-based confidence
    if (issue.severity === 'critical') confidence += 30;
    else if (issue.severity === 'warning') confidence += 15;

    // Threshold exceeded confidence
    const exceedRatio = issue.currentValue / issue.threshold;
    if (exceedRatio > 1.2) confidence += 20;
    else if (exceedRatio > 1.1) confidence += 10;

    // Trend-based confidence
    if (issue.trend && issue.trend.confidence) {
      confidence += Math.min(issue.trend.confidence, 20);
    }

    // Process-specific confidence
    if (issue.process && issue.process !== 'Unknown process') {
      confidence += 10;
    }

    return Math.min(Math.max(confidence, 10), 99);
  }

  /**
   * Get success rate from knowledge base
   */
  getSuccessRate(issueType) {
    try {
      const knowledgePath = path.join(__dirname, '../config/localData.json');
      if (fs.existsSync(knowledgePath)) {
        const data = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
        const knowledge = data.knowledge || [];
        
        const typeKnowledge = knowledge.find(k => k.issueType === issueType);
        return typeKnowledge ? typeKnowledge.successRate : null;
      }
    } catch (error) {
      console.warn('Failed to load success rate:', error.message);
    }
    
    return null;
  }
}

module.exports = new AdvancedDetector();