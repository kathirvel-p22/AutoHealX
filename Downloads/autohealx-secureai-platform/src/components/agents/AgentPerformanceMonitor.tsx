/**
 * Agent Performance Monitor
 * Real-time monitoring of AI agent activity and performance
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Brain, Zap, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { AIAgent, AgentType } from '../../types/agents';
import { cn } from '../../lib/utils';

interface AgentPerformanceMonitorProps {
  analyses?: any[];
  showDetails?: boolean;
}

// Mock agent data for demonstration
const AGENT_DEFINITIONS: Record<AgentType, { name: string; description: string; icon: any }> = {
  cpu: { name: 'CPU Agent', description: 'Compute resource analysis', icon: Activity },
  storage: { name: 'Storage Agent', description: 'PVC monitoring', icon: Activity },
  network: { name: 'Network Agent', description: 'Traffic analysis', icon: Zap },
  dependency: { name: 'Dependency Agent', description: 'Service mapping', icon: Brain },
  correlation: { name: 'Correlation Agent', description: 'Event linking', icon: TrendingUp },
  rca: { name: 'RCA Agent', description: 'Root cause tracing', icon: AlertCircle },
  prediction: { name: 'Prediction Agent', description: 'Failure forecasting', icon: TrendingUp },
  recommendation: { name: 'Recommendation Agent', description: 'Recovery generation', icon: CheckCircle },
  recovery: { name: 'Recovery Agent', description: 'Healing workflows', icon: Zap },
  threat: { name: 'Threat Agent', description: 'Security anomalies', icon: AlertCircle },
  audit: { name: 'Audit Agent', description: 'Integrity validation', icon: CheckCircle },
  policy: { name: 'Policy Agent', description: 'Governance', icon: CheckCircle },
  access: { name: 'Access Agent', description: 'RBAC enforcement', icon: CheckCircle },
};

export function AgentPerformanceMonitor({ analyses, showDetails = true }: AgentPerformanceMonitorProps) {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);

  useEffect(() => {
    // Initialize agents
    const initialAgents: AIAgent[] = Object.entries(AGENT_DEFINITIONS).map(([type, def]) => ({
      id: `${type}-agent-001`,
      name: def.name,
      type: type as AgentType,
      description: def.description,
      status: 'idle',
      confidence: 0,
      lastActivity: new Date().toISOString(),
      totalAnalyses: 0,
      successRate: 100,
    }));
    setAgents(initialAgents);

    // Simulate agent activity
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        const isActive = Math.random() > 0.7;
        return {
          ...agent,
          status: isActive ? 'processing' : agent.status === 'processing' ? 'completed' : 'idle',
          confidence: isActive ? Math.floor(Math.random() * 30) + 70 : agent.confidence,
          lastActivity: isActive ? new Date().toISOString() : agent.lastActivity,
          totalAnalyses: isActive ? agent.totalAnalyses + 1 : agent.totalAnalyses,
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Update agents based on actual analyses
  useEffect(() => {
    if (analyses && analyses.length > 0) {
      setAgents(prev => prev.map(agent => {
        const analysis = analyses.find(a => a.agentType === agent.type);
        if (analysis) {
          return {
            ...agent,
            status: analysis.status,
            confidence: analysis.confidence,
            lastActivity: analysis.timestamp,
            totalAnalyses: agent.totalAnalyses + 1,
          };
        }
        return agent;
      }));
    }
  }, [analyses]);

  const activeAgents = agents.filter(a => a.status === 'processing' || a.status === 'analyzing');
  const completedAgents = agents.filter(a => a.status === 'completed');
  const avgConfidence = agents.reduce((sum, a) => sum + a.confidence, 0) / agents.length;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          AI Agent Performance
        </h3>
        <div className="flex items-center gap-4 mt-2 text-[10px] font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary font-bold">{activeAgents.length} Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">{completedAgents.length} Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">Avg: {Math.round(avgConfidence)}%</span>
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-2">
          {agents.map((agent, index) => {
            const Icon = AGENT_DEFINITIONS[agent.type].icon;
            const isSelected = selectedAgent === agent.type;
            
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSelectedAgent(isSelected ? null : agent.type)}
                className={cn(
                  "p-3 rounded-sm border cursor-pointer transition-all",
                  isSelected ? "bg-primary/5 border-primary" : "bg-card border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Icon */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      agent.status === 'processing' ? "bg-primary/20 animate-pulse" :
                      agent.status === 'completed' ? "bg-green-500/20" :
                      agent.status === 'error' ? "bg-red-500/20" :
                      "bg-secondary"
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        agent.status === 'processing' ? "text-primary" :
                        agent.status === 'completed' ? "text-green-500" :
                        agent.status === 'error' ? "text-red-500" :
                        "text-muted-foreground"
                      )} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground truncate">{agent.name}</span>
                        {agent.status === 'processing' && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-1.5 h-1.5 rounded-full bg-primary"
                          />
                        )}
                      </div>
                      {showDetails && (
                        <p className="text-[9px] text-muted-foreground truncate">{agent.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Status & Metrics */}
                  <div className="flex items-center gap-3">
                    {showDetails && (
                      <div className="text-right">
                        <div className="text-xs font-bold text-primary">{agent.confidence}%</div>
                        <div className="text-[9px] text-muted-foreground">{agent.totalAnalyses} runs</div>
                      </div>
                    )}
                    
                    <div className={cn(
                      "px-2 py-1 rounded-sm text-[9px] font-bold uppercase",
                      agent.status === 'processing' ? "bg-primary/10 text-primary" :
                      agent.status === 'completed' ? "bg-green-500/10 text-green-500" :
                      agent.status === 'error' ? "bg-red-500/10 text-red-500" :
                      "bg-secondary text-secondary-foreground"
                    )}>
                      {agent.status}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isSelected && showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-border space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-muted-foreground">Success Rate:</span>
                        <div className="font-bold text-foreground">{agent.successRate}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Active:</span>
                        <div className="font-bold text-foreground">
                          {new Date(agent.lastActivity).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Confidence Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-muted-foreground">Confidence</span>
                        <span className="text-[9px] font-bold text-foreground">{agent.confidence}%</span>
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${agent.confidence}%` }}
                          className={cn(
                            "h-full rounded-full",
                            agent.confidence >= 80 ? "bg-primary" :
                            agent.confidence >= 60 ? "bg-yellow-500" :
                            "bg-orange-500"
                          )}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer Stats */}
      {showDetails && (
        <div className="p-4 border-t border-border bg-card">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-primary">{agents.length}</div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Total Agents</p>
            </div>
            <div>
              <div className="text-lg font-bold text-green-500">
                {agents.reduce((sum, a) => sum + a.totalAnalyses, 0)}
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Analyses</p>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{Math.round(avgConfidence)}%</div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Avg Confidence</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
