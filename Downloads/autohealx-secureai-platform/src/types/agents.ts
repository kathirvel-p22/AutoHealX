/**
 * AI Agent Types
 * Multi-agent orchestration for autonomous infrastructure intelligence
 */

export type AgentType = 
  | 'cpu'
  | 'storage'
  | 'network'
  | 'dependency'
  | 'correlation'
  | 'rca'
  | 'prediction'
  | 'recommendation'
  | 'recovery'
  | 'threat'
  | 'audit'
  | 'policy'
  | 'access';

export type AgentStatus = 'idle' | 'analyzing' | 'processing' | 'completed' | 'error';

export interface AgentFinding {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  evidence: string[];
  confidence: number;  // 0-100
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AgentAnalysis {
  agentId: string;
  agentType: AgentType;
  status: AgentStatus;
  findings: AgentFinding[];
  recommendations: string[];
  confidence: number;
  processingTime: number;  // milliseconds
  timestamp: string;
}

export interface AIAgent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  status: AgentStatus;
  confidence: number;
  lastActivity: string;
  totalAnalyses: number;
  successRate: number;
}

export interface AgentOrchestrationResult {
  incidentId: string;
  analyses: AgentAnalysis[];
  correlations: CorrelationResult[];
  rootCause: RootCauseAnalysis | null;
  predictions: Prediction[];
  recommendations: RemediationRecommendation[];
  overallConfidence: number;
  processingTime: number;
  timestamp: string;
}

export interface CorrelationResult {
  id: string;
  events: string[];
  relationship: 'causal' | 'temporal' | 'dependency';
  confidence: number;
  description: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  timestamp: string;
  service: string;
  event: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metadata: Record<string, any>;
}

export interface RootCauseAnalysis {
  id: string;
  rootService: string;
  rootCause: string;
  cascadeChain: string[];
  confidence: number;
  evidence: string[];
  impactedServices: string[];
  reasoning: string;
}

export interface Prediction {
  id: string;
  targetService: string;
  failureType: string;
  probability: number;
  estimatedTime: string;
  confidence: number;
  reasoning: string;
  indicators: string[];
  recommendedActions: string[];
}

export interface RemediationRecommendation {
  id: string;
  action: 'restart' | 'scale' | 'rollback' | 'isolate' | 'flush_cache' | 'increase_timeout';
  targetService: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedImpact: string;
  estimatedDuration: string;
  confidence: number;
  prerequisites: string[];
  rollbackPlan: string;
}

export interface AgentMessage {
  from: AgentType;
  to: AgentType | 'orchestrator';
  type: 'request' | 'response' | 'notification';
  payload: any;
  timestamp: string;
}
