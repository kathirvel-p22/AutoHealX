/**
 * Agent Orchestrator
 * Central coordination system for multi-agent AI analysis
 */

import { GoogleGenAI } from '@google/genai';
import {
  AgentOrchestrationResult,
  AgentAnalysis,
  AgentType,
  CorrelationResult,
  RootCauseAnalysis,
  Prediction,
  RemediationRecommendation,
  AgentFinding
} from '../types/agents';
import { TopologyNode } from '../types/topology';
import { topologyService } from './topologyService';

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined, using mock responses');
      return null;
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export class AgentOrchestrator {
  private static instance: AgentOrchestrator;

  private constructor() {}

  static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  /**
   * Orchestrate full multi-agent analysis for an incident
   */
  async analyzeIncident(
    incidentId: string,
    logs: string,
    serviceName: string
  ): Promise<AgentOrchestrationResult> {
    const startTime = Date.now();
    
    // Get topology context
    const topology = topologyService.getTopology();
    const affectedService = topology.nodes.find(n => n.name.toLowerCase().includes(serviceName.toLowerCase()));
    
    // Run agents in parallel
    const [
      cpuAnalysis,
      networkAnalysis,
      dependencyAnalysis,
      correlationResults,
      rootCause,
      predictions,
      recommendations
    ] = await Promise.all([
      this.runCPUAgent(logs, affectedService),
      this.runNetworkAgent(logs, affectedService),
      this.runDependencyAgent(logs, affectedService, topology.nodes),
      this.runCorrelationAgent(logs, serviceName),
      this.runRCAAgent(logs, serviceName, topology.nodes),
      this.runPredictionAgent(logs, serviceName, topology.nodes),
      this.runRecommendationAgent(logs, serviceName, affectedService)
    ]);

    const analyses = [cpuAnalysis, networkAnalysis, dependencyAnalysis];
    
    // Calculate overall confidence
    const overallConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

    return {
      incidentId,
      analyses,
      correlations: correlationResults,
      rootCause,
      predictions,
      recommendations,
      overallConfidence,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * CPU Agent - Analyzes compute resource issues
   */
  private async runCPUAgent(logs: string, service?: TopologyNode): Promise<AgentAnalysis> {
    const startTime = Date.now();
    
    const prompt = `You are a CPU Analysis Agent. Analyze these logs for compute resource issues:

Logs:
${logs}

${service ? `Service Metrics:
- CPU: ${service.metrics.cpu}%
- Memory: ${service.metrics.memory}MB
- Requests: ${service.metrics.requests}/s
` : ''}

Identify:
1. CPU bottlenecks
2. Memory pressure
3. Resource exhaustion
4. Performance degradation

Return JSON with findings array containing: {severity, title, description, evidence[], confidence}`;

    try {
      const ai = getAI();
      if (!ai) {
        return this.createMockAnalysis('cpu', startTime);
      }

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const text = result.text || '{}';
      const data = JSON.parse(text);

      return {
        agentId: 'cpu-agent-001',
        agentType: 'cpu',
        status: 'completed',
        findings: data.findings || [],
        recommendations: data.recommendations || [],
        confidence: data.confidence || 75,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('CPU Agent error:', error);
      return this.createErrorAnalysis('cpu', startTime);
    }
  }

  /**
   * Network Agent - Analyzes network and connectivity issues
   */
  private async runNetworkAgent(logs: string, service?: TopologyNode): Promise<AgentAnalysis> {
    const startTime = Date.now();
    
    try {
      const ai = getAI();
      if (!ai) {
        return this.createMockAnalysis('network', startTime);
      }

      const prompt = `You are a Network Analysis Agent. Analyze these logs for network issues:

Logs:
${logs}

${service ? `Service Metrics:
- Latency: ${service.metrics.latency}ms
- Error Rate: ${service.metrics.errorRate}%
- Requests: ${service.metrics.requests}/s
` : ''}

Identify:
1. Connection timeouts
2. Network latency
3. DNS issues
4. Service mesh problems

Return JSON with findings array containing: {severity, title, description, evidence[], confidence}`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const text = result.text || '{}';
      const data = JSON.parse(text);

      return {
        agentId: 'network-agent-001',
        agentType: 'network',
        status: 'completed',
        findings: data.findings || [],
        recommendations: data.recommendations || [],
        confidence: data.confidence || 80,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Network Agent error:', error);
      return this.createMockAnalysis('network', startTime);
    }
  }

  /**
   * Dependency Agent - Analyzes service dependencies
   */
  private async runDependencyAgent(
    logs: string,
    service: TopologyNode | undefined,
    allServices: TopologyNode[]
  ): Promise<AgentAnalysis> {
    const startTime = Date.now();
    
    try {
      const ai = getAI();
      if (!ai) {
        return this.createMockAnalysis('dependency', startTime);
      }

      const dependencies = service ? 
        service.dependencies.map(depId => allServices.find(s => s.id === depId)?.name).filter(Boolean) : [];

      const prompt = `You are a Dependency Analysis Agent. Analyze service dependencies:

Logs:
${logs}

${service ? `Service: ${service.name}
Dependencies: ${dependencies.join(', ')}
` : ''}

Identify:
1. Downstream failures
2. Cascade effects
3. Dependency health
4. Circuit breaker issues

Return JSON with findings array containing: {severity, title, description, evidence[], confidence}`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const text = result.text || '{}';
      const data = JSON.parse(text);

      return {
        agentId: 'dependency-agent-001',
        agentType: 'dependency',
        status: 'completed',
        findings: data.findings || [],
        recommendations: data.recommendations || [],
        confidence: data.confidence || 85,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Dependency Agent error:', error);
      return this.createMockAnalysis('dependency', startTime);
    }
  }

  /**
   * Correlation Agent - Links related events
   */
  private async runCorrelationAgent(logs: string, serviceName: string): Promise<CorrelationResult[]> {
    try {
      const ai = getAI();
      if (!ai) {
        return this.createMockCorrelations();
      }

      const prompt = `You are a Correlation Analysis Agent. Find temporal and causal relationships:

Logs:
${logs}

Service: ${serviceName}

Identify:
1. Event sequences
2. Causal relationships
3. Temporal patterns

Return JSON array of correlations: [{events[], relationship, confidence, description, timeline[]}]`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const text = result.text || '[]';
      const correlations = JSON.parse(text);

      return correlations.map((c: any, i: number) => ({
        id: `correlation-${i}`,
        ...c
      }));
    } catch (error) {
      console.error('Correlation Agent error:', error);
      return this.createMockCorrelations();
    }
  }

  /**
   * RCA Agent - Root Cause Analysis
   */
  private async runRCAAgent(
    logs: string,
    serviceName: string,
    allServices: TopologyNode[]
  ): Promise<RootCauseAnalysis | null> {
    try {
      const ai = getAI();
      if (!ai) {
        return this.createMockRCA(serviceName);
      }

      const prompt = `You are a Root Cause Analysis Agent. Determine the origin of this failure:

Logs:
${logs}

Service: ${serviceName}
Available Services: ${allServices.map(s => s.name).join(', ')}

Determine:
1. Root cause service
2. Root cause reason
3. Cascade chain
4. Impacted services

Return JSON: {rootService, rootCause, cascadeChain[], confidence, evidence[], impactedServices[], reasoning}`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const text = result.text || '{}';
      const data = JSON.parse(text);

      if (data && data.rootService) {
        return {
          id: `rca-${Date.now()}`,
          ...data
        };
      }
      return this.createMockRCA(serviceName);
    } catch (error) {
      console.error('RCA Agent error:', error);
      return this.createMockRCA(serviceName);
    }
  }

  /**
   * Prediction Agent - Forecast future failures
   */
  private async runPredictionAgent(
    logs: string,
    serviceName: string,
    allServices: TopologyNode[]
  ): Promise<Prediction[]> {
    try {
      const ai = getAI();
      if (!ai) {
        return this.createMockPredictions(serviceName);
      }

      const prompt = `You are a Prediction Agent. Forecast potential failures:

Logs:
${logs}

Service: ${serviceName}

Predict:
1. Likely failures
2. Time to failure
3. Probability
4. Early indicators

Return JSON array: [{targetService, failureType, probability, estimatedTime, confidence, reasoning, indicators[], recommendedActions[]}]`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const text = result.text || '[]';
      const predictions = JSON.parse(text);

      return predictions.map((p: any, i: number) => ({
        id: `prediction-${i}`,
        ...p
      }));
    } catch (error) {
      console.error('Prediction Agent error:', error);
      return this.createMockPredictions(serviceName);
    }
  }

  /**
   * Recommendation Agent - Generate remediation actions
   */
  private async runRecommendationAgent(
    logs: string,
    serviceName: string,
    service?: TopologyNode
  ): Promise<RemediationRecommendation[]> {
    try {
      const ai = getAI();
      if (!ai) {
        return this.createMockRecommendations(serviceName);
      }

      const prompt = `You are a Remediation Recommendation Agent. Generate recovery actions:

Logs:
${logs}

Service: ${serviceName}
${service ? `Current State:
- CPU: ${service.metrics.cpu}%
- Memory: ${service.metrics.memory}MB
- Error Rate: ${service.metrics.errorRate}%
` : ''}

Generate:
1. Immediate actions
2. Risk assessment
3. Expected impact
4. Rollback plan

Return JSON array: [{action, targetService, description, riskLevel, expectedImpact, estimatedDuration, confidence, prerequisites[], rollbackPlan}]`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const text = result.text || '[]';
      const recommendations = JSON.parse(text);

      return recommendations.map((r: any, i: number) => ({
        id: `recommendation-${i}`,
        ...r
      }));
    } catch (error) {
      console.error('Recommendation Agent error:', error);
      return this.createMockRecommendations(serviceName);
    }
  }

  /**
   * Create mock analysis for demo purposes
   */
  private createMockAnalysis(agentType: AgentType, startTime: number): AgentAnalysis {
    const mockFindings: Record<AgentType, AgentFinding[]> = {
      cpu: [{
        id: 'cpu-1',
        severity: 'critical',
        title: 'CPU Saturation Detected',
        description: 'Service CPU usage exceeded 90% threshold',
        evidence: ['CPU: 94%', 'Memory pressure detected', 'GC overhead limit'],
        confidence: 87,
        timestamp: new Date().toISOString()
      }],
      network: [{
        id: 'net-1',
        severity: 'warning',
        title: 'Connection Timeout Pattern',
        description: 'Multiple connection timeouts to downstream services',
        evidence: ['Timeout after 5000ms', '43 dropped connections'],
        confidence: 82,
        timestamp: new Date().toISOString()
      }],
      dependency: [{
        id: 'dep-1',
        severity: 'critical',
        title: 'Cascade Failure Detected',
        description: 'Downstream service failure causing upstream impact',
        evidence: ['Payment gateway unreachable', 'Circuit breaker open'],
        confidence: 91,
        timestamp: new Date().toISOString()
      }],
      storage: [],
      correlation: [],
      rca: [],
      prediction: [],
      recommendation: [],
      recovery: [],
      threat: [],
      audit: [],
      policy: [],
      access: []
    };

    return {
      agentId: `${agentType}-agent-001`,
      agentType,
      status: 'completed',
      findings: mockFindings[agentType] || [],
      recommendations: ['Scale replicas', 'Increase timeout', 'Flush cache'],
      confidence: 85,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }

  private createMockCorrelations(): CorrelationResult[] {
    return [{
      id: 'corr-1',
      events: ['CPU spike', 'Memory pressure', 'Connection timeout'],
      relationship: 'causal',
      confidence: 88,
      description: 'Resource exhaustion led to connection failures',
      timeline: [{
        timestamp: new Date(Date.now() - 300000).toISOString(),
        service: 'payment-service',
        event: 'CPU spike detected',
        severity: 'warning',
        metadata: { cpu: 94 }
      }]
    }];
  }

  private createMockRCA(serviceName: string): RootCauseAnalysis {
    return {
      id: `rca-${Date.now()}`,
      rootService: serviceName,
      rootCause: 'Cache saturation causing upstream timeout propagation',
      cascadeChain: [serviceName, 'api-gateway', 'frontend'],
      confidence: 87,
      evidence: ['Cache hit rate dropped to 12%', 'Memory usage at 94%', 'Connection pool exhausted'],
      impactedServices: ['api-gateway', 'frontend', 'user-service'],
      reasoning: 'Analysis indicates cache saturation as primary trigger, leading to increased latency and timeout cascades'
    };
  }

  private createMockPredictions(serviceName: string): Prediction[] {
    return [{
      id: 'pred-1',
      targetService: 'database',
      failureType: 'Connection pool exhaustion',
      probability: 87,
      estimatedTime: '4 minutes',
      confidence: 82,
      reasoning: 'Current connection growth rate will exceed pool limit',
      indicators: ['Connection count trending up', 'Query latency increasing'],
      recommendedActions: ['Scale database replicas', 'Increase connection pool size']
    }];
  }

  private createMockRecommendations(serviceName: string): RemediationRecommendation[] {
    return [
      {
        id: 'rec-1',
        action: 'flush_cache',
        targetService: serviceName,
        description: 'Flush cache to free memory and restore hit rate',
        riskLevel: 'low',
        expectedImpact: 'Temporary latency spike for 30 seconds',
        estimatedDuration: '30 seconds',
        confidence: 92,
        prerequisites: ['Verify cache is not in use for critical operations'],
        rollbackPlan: 'Cache will automatically rebuild from database'
      },
      {
        id: 'rec-2',
        action: 'scale',
        targetService: serviceName,
        description: 'Scale service replicas from 2 to 4',
        riskLevel: 'medium',
        expectedImpact: 'Improved throughput, reduced CPU per instance',
        estimatedDuration: '2 minutes',
        confidence: 88,
        prerequisites: ['Sufficient cluster capacity'],
        rollbackPlan: 'Scale down to 2 replicas if issues persist'
      }
    ];
  }

  /**
   * Create error analysis fallback
   */
  private createErrorAnalysis(agentType: AgentType, startTime: number): AgentAnalysis {
    return {
      agentId: `${agentType}-agent-001`,
      agentType,
      status: 'error',
      findings: [],
      recommendations: [],
      confidence: 0,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

export const agentOrchestrator = AgentOrchestrator.getInstance();
