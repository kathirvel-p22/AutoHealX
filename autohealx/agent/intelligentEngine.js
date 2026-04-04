// ============================================================
// AutoHealX — Intelligent Decision Engine
// ADVANCED: Rule-based AI that makes autonomous decisions
// ============================================================

const fs = require('fs');
const path = require('path');

class IntelligentEngine {
  constructor() {
    this.rules = this.loadRules();
    this.trends = [];
    this.predictions = new Map();
    this.confidence = new Map();
  }

  /**
   * 🧠 CORE INTELLIGENCE: Analyze system state and make decisions
   */
  analyzeAndDecide(metrics, history = []) {
    const decisions = [];
    
    // 1. TREND ANALYSIS (Advanced Feature)
    const trend = this.analyzeTrend(metrics, history);
    
    // 2. PREDICTIVE ANALYSIS
    const prediction = this.predictFutureIssues(metrics, trend);
    
    // 3. RULE-BASED DECISION MAKING
    const ruleDecisions = this.applyIntelligentRules(metrics, trend, prediction);
    
    // 4. CONFIDENCE SCORING
    ruleDecisions.forEach(decision => {
      decision.confidence = this.calculateConfidence(decision, metrics, trend);
      decision.explanation = this.generateExplanation(decision, metrics, trend);
      decision.preventive = this.isPreventiveAction(decision, prediction);
    });

    return {
      decisions: ruleDecisions,
      trend,
      prediction,
      intelligence: {
        riskLevel: this.calculateRiskLevel(metrics, trend),
        recommendation: this.generateRecommendation(metrics, trend, prediction),
        futureRisk: prediction.risk
      }
    };
  }

  /**
   * 📈 TREND ANALYSIS: Detect patterns over time
   */
  analyzeTrend(current, history) {
    if (history.length < 3) {
      return { 
        cpu: { direction: 'stable', rate: 0, prediction: current.cpu || 0 },
        memory: { direction: 'stable', rate: 0, prediction: current.memory || 0 },
        overall: { direction: 'stable', severity: 'low' },
        pattern: 'insufficient_data' 
      };
    }

    const recent = history.slice(-5);
    // Add safety checks for cpu and memory properties
    const cpuValues = recent.map(h => h?.cpu || 0).filter(v => v !== undefined);
    const memoryValues = recent.map(h => h?.memory || 0).filter(v => v !== undefined);
    
    const cpuTrend = this.calculateTrend(cpuValues);
    const memoryTrend = this.calculateTrend(memoryValues);
    
    return {
      cpu: {
        direction: cpuTrend.direction,
        rate: cpuTrend.rate,
        prediction: cpuTrend.prediction
      },
      memory: {
        direction: memoryTrend.direction,
        rate: memoryTrend.rate,
        prediction: memoryTrend.prediction
      },
      overall: this.determineOverallTrend(cpuTrend, memoryTrend),
      pattern: this.detectPattern(recent)
    };
  }

  /**
   * Determine overall system trend from CPU and memory trends
   */
  determineOverallTrend(cpuTrend, memoryTrend) {
    const cpuScore = cpuTrend.direction === 'increasing' ? cpuTrend.rate : 0;
    const memoryScore = memoryTrend.direction === 'increasing' ? memoryTrend.rate : 0;
    const totalScore = cpuScore + memoryScore;
    
    if (totalScore > 10) {
      return { direction: 'increasing', severity: 'high' };
    } else if (totalScore > 5) {
      return { direction: 'increasing', severity: 'medium' };
    } else if (totalScore > 0) {
      return { direction: 'increasing', severity: 'low' };
    } else {
      return { direction: 'stable', severity: 'low' };
    }
  }

  /**
   * 🔮 PREDICTIVE ANALYSIS: Forecast future issues
   */
  predictFutureIssues(current, trend) {
    const predictions = [];
    
    // CPU Prediction
    if (trend.cpu.direction === 'increasing' && current.cpu > 60) {
      const timeToFailure = this.calculateTimeToFailure(current.cpu, trend.cpu.rate, 90);
      predictions.push({
        type: 'CPU_OVERLOAD',
        probability: this.calculateProbability(current.cpu, trend.cpu.rate, 90),
        timeToFailure,
        severity: timeToFailure < 300 ? 'critical' : 'warning'
      });
    }

    // Memory Prediction
    if (trend.memory.direction === 'increasing' && current.memory > 70) {
      const timeToFailure = this.calculateTimeToFailure(current.memory, trend.memory.rate, 95);
      predictions.push({
        type: 'MEMORY_EXHAUSTION',
        probability: this.calculateProbability(current.memory, trend.memory.rate, 95),
        timeToFailure,
        severity: timeToFailure < 600 ? 'critical' : 'warning'
      });
    }

    return {
      predictions,
      risk: predictions.length > 0 ? Math.max(...predictions.map(p => p.probability)) : 0,
      timeToNextIssue: predictions.length > 0 ? Math.min(...predictions.map(p => p.timeToFailure)) : null
    };
  }

  /**
   * 🎯 INTELLIGENT RULES: Advanced decision making
   */
  applyIntelligentRules(metrics, trend, prediction) {
    const decisions = [];

    // RULE 1: Immediate Critical Response
    if (metrics.cpu > 90) {
      decisions.push({
        type: 'IMMEDIATE_CPU_ACTION',
        action: 'KILL_TOP_CPU_PROCESS',
        priority: 'critical',
        reason: 'CPU overload detected - immediate action required',
        impact: 'Prevents system freeze',
        automated: true
      });
    }

    // RULE 2: Predictive Prevention (ADVANCED)
    if (prediction.risk > 80 && trend.cpu.direction === 'increasing') {
      decisions.push({
        type: 'PREVENTIVE_CPU_ACTION',
        action: 'REDUCE_LOAD',
        priority: 'high',
        reason: `CPU trending upward (${trend.cpu.rate}%/min) - preventing future overload`,
        impact: 'Prevents predicted system failure',
        automated: false,
        preventive: true
      });
    }

    // RULE 3: Memory Intelligence
    if (metrics.memory > 85 && trend.memory.direction === 'increasing') {
      decisions.push({
        type: 'INTELLIGENT_MEMORY_ACTION',
        action: 'KILL_TOP_MEMORY_PROCESS',
        priority: 'high',
        reason: `Memory at ${metrics.memory}% and rising - proactive intervention`,
        impact: 'Prevents memory exhaustion',
        automated: trend.memory.rate > 2 // Auto if rising fast
      });
    }

    // RULE 4: Pattern-Based Intelligence
    if (trend.pattern === 'oscillating' && metrics.cpu > 70) {
      decisions.push({
        type: 'PATTERN_BASED_ACTION',
        action: 'MONITOR_INTENSIVE',
        priority: 'medium',
        reason: 'Oscillating CPU pattern detected - enhanced monitoring required',
        impact: 'Early detection of recurring issues',
        automated: true
      });
    }

    return decisions;
  }

  /**
   * 🎓 LEARNING SYSTEM: Learn from past actions
   */
  learnFromAction(action, result, metrics) {
    const learning = {
      action: action.type,
      success: result.success,
      metrics: {
        cpu: metrics.cpu,
        memory: metrics.memory
      },
      timestamp: Date.now(),
      effectiveness: this.calculateEffectiveness(action, result, metrics)
    };

    // Store learning
    this.storeLearning(learning);
    
    // Update confidence scores
    this.updateConfidence(action.type, learning.effectiveness);
    
    return learning;
  }

  /**
   * 💡 EXPLANATION GENERATOR: Make decisions transparent
   */
  generateExplanation(decision, metrics, trend) {
    const explanations = {
      IMMEDIATE_CPU_ACTION: `CPU at ${metrics.cpu}% (critical threshold: 90%). System performance severely degraded. Terminating highest CPU process will immediately reduce load and prevent system freeze.`,
      
      PREVENTIVE_CPU_ACTION: `CPU trending upward at ${trend.cpu.rate}%/min. Current: ${metrics.cpu}%. Predicted to reach critical levels in ${Math.round(trend.cpu.prediction)} minutes. Proactive load reduction prevents future crisis.`,
      
      INTELLIGENT_MEMORY_ACTION: `Memory consumption at ${metrics.memory}% and increasing by ${trend.memory.rate}%/min. Terminating memory-intensive process prevents system instability and potential data loss.`,
      
      PATTERN_BASED_ACTION: `Detected ${trend.pattern} CPU pattern. This typically indicates resource contention or background processes. Enhanced monitoring will identify root cause.`
    };

    return explanations[decision.type] || `Intelligent analysis determined ${decision.action} is optimal for current system state.`;
  }

  /**
   * 🎯 CONFIDENCE CALCULATION: How sure are we?
   */
  calculateConfidence(decision, metrics, trend) {
    let confidence = 50; // Base confidence

    // Historical success rate
    const historicalSuccess = this.getHistoricalSuccess(decision.type);
    confidence += historicalSuccess * 0.3;

    // Metric severity
    if (metrics.cpu > 90 || metrics.memory > 90) confidence += 30;
    if (metrics.cpu > 80 || metrics.memory > 80) confidence += 20;

    // Trend strength
    if (trend.cpu.direction === 'increasing' && trend.cpu.rate > 5) confidence += 15;
    if (trend.memory.direction === 'increasing' && trend.memory.rate > 3) confidence += 15;

    // Pattern recognition
    if (trend.pattern !== 'unknown') confidence += 10;

    return Math.min(Math.round(confidence), 95); // Cap at 95%
  }

  // Helper methods
  calculateTrend(values) {
    if (values.length < 2) return { direction: 'stable', rate: 0, prediction: 0 };
    
    const recent = values.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const rate = (last - first) / recent.length;
    
    return {
      direction: rate > 1 ? 'increasing' : rate < -1 ? 'decreasing' : 'stable',
      rate: Math.abs(rate),
      prediction: avg + (rate * 5) // 5 cycles ahead
    };
  }

  calculateTimeToFailure(current, rate, threshold) {
    if (rate <= 0) return Infinity;
    return Math.round((threshold - current) / rate * 5); // 5 second intervals
  }

  calculateProbability(current, rate, threshold) {
    const distance = threshold - current;
    const timeToReach = distance / Math.max(rate, 0.1);
    return Math.min(Math.round((1 / (timeToReach + 1)) * 100), 95);
  }

  detectPattern(history) {
    if (history.length < 4) return 'insufficient_data';
    
    const cpuValues = history.map(h => h.cpu);
    const variance = this.calculateVariance(cpuValues);
    
    if (variance > 100) return 'oscillating';
    if (variance < 10) return 'stable';
    return 'trending';
  }

  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  loadRules() {
    // Default intelligent rules
    return {
      cpu_critical: { threshold: 90, action: 'immediate', confidence: 95 },
      cpu_high: { threshold: 75, action: 'preventive', confidence: 80 },
      memory_critical: { threshold: 90, action: 'immediate', confidence: 90 },
      memory_high: { threshold: 80, action: 'preventive', confidence: 75 }
    };
  }

  storeLearning(learning) {
    // Store in knowledge base for future reference
    try {
      const knowledgePath = path.join(__dirname, '../data/intelligence.json');
      let knowledge = [];
      
      if (fs.existsSync(knowledgePath)) {
        knowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
      }
      
      knowledge.push(learning);
      
      // Keep only last 1000 learnings
      if (knowledge.length > 1000) {
        knowledge = knowledge.slice(-1000);
      }
      
      fs.writeFileSync(knowledgePath, JSON.stringify(knowledge, null, 2));
    } catch (error) {
      console.warn('Failed to store learning:', error.message);
    }
  }

  getHistoricalSuccess(actionType) {
    try {
      const knowledgePath = path.join(__dirname, '../data/intelligence.json');
      if (!fs.existsSync(knowledgePath)) return 50;
      
      const knowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
      const relevant = knowledge.filter(k => k.action === actionType);
      
      if (relevant.length === 0) return 50;
      
      const successRate = relevant.filter(k => k.success).length / relevant.length;
      return Math.round(successRate * 100);
    } catch (error) {
      return 50;
    }
  }

  calculateRiskLevel(metrics, trend) {
    let risk = 0;
    
    if (metrics.cpu > 80) risk += 30;
    if (metrics.memory > 80) risk += 30;
    if (trend.cpu.direction === 'increasing') risk += 20;
    if (trend.memory.direction === 'increasing') risk += 20;
    
    return Math.min(risk, 100);
  }

  generateRecommendation(metrics, trend, prediction) {
    if (prediction.risk > 80) {
      return `HIGH RISK: System failure predicted in ${Math.round(prediction.timeToNextIssue / 60)} minutes. Immediate action recommended.`;
    }
    
    if (trend.cpu.direction === 'increasing' && metrics.cpu > 60) {
      return `PREVENTIVE: CPU trending upward. Consider closing non-essential applications.`;
    }
    
    if (metrics.memory > 75) {
      return `MEMORY ALERT: High memory usage detected. Monitor for memory leaks.`;
    }
    
    return `SYSTEM STABLE: All metrics within normal ranges. Continuous monitoring active.`;
  }

  isPreventiveAction(decision, prediction) {
    return decision.preventive || prediction.risk > 70;
  }

  calculateEffectiveness(action, result, metrics) {
    if (!result.success) return 0;
    
    // Calculate how much the action improved the system
    const improvement = result.improvement || 0;
    const speed = result.executionTime < 5000 ? 20 : 10;
    
    return Math.min(improvement + speed, 100);
  }
}

module.exports = new IntelligentEngine();