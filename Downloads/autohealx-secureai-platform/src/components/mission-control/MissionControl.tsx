/**
 * Mission Control Dashboard
 * Ultimate visualization & control center for autonomous operations
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, Brain, Shield, Zap, AlertTriangle, TrendingUp, 
  CheckCircle, Clock, Target, Network
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TopologyGraph } from '../topology/TopologyGraph';
import { AgentOrchestrationResult } from '../../types/agents';
import { Incident } from '../IncidentList';

interface MissionControlProps {
  incidents: Incident[];
  orchestrationResults: Map<string, AgentOrchestrationResult>;
}

export function MissionControl({ incidents, orchestrationResults }: MissionControlProps) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [threatLevel, setThreatLevel] = useState<'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL'>('ELEVATED');

  const openIncidents = incidents.filter(i => i.status === 'open');
  const criticalIncidents = openIncidents.filter(i => i.severity === 'critical');

  // Calculate threat level based on incidents
  useEffect(() => {
    if (criticalIncidents.length > 5) {
      setThreatLevel('CRITICAL');
    } else if (criticalIncidents.length > 2) {
      setThreatLevel('HIGH');
    } else if (openIncidents.length > 10) {
      setThreatLevel('ELEVATED');
    } else {
      setThreatLevel('LOW');
    }
  }, [incidents]);

  const getThreatColor = () => {
    switch (threatLevel) {
      case 'LOW': return 'text-primary';
      case 'ELEVATED': return 'text-yellow-500';
      case 'HIGH': return 'text-orange-500';
      case 'CRITICAL': return 'text-red-500';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Mission Control Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
              <Target className="w-6 h-6 text-primary" />
              Mission Control
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono mt-1 uppercase tracking-widest">
              Autonomous Infrastructure Intelligence & Self-Healing Operations
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Threat Level */}
            <div className="text-right">
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest block mb-1">Threat Level</span>
              <div className={cn("text-2xl font-black uppercase tracking-tight", getThreatColor())}>
                {threatLevel}
              </div>
            </div>

            {/* System Status */}
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-px bg-border p-px overflow-hidden">
        {/* Live Topology - Large Left Panel */}
        <div className="col-span-7 row-span-7 bg-background">
          <TopologyGraph onNodeSelect={(node) => console.log('Node selected:', node)} />
        </div>

        {/* Incident Feed - Top Right */}
        <div className="col-span-5 row-span-4 bg-background overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              Active Incidents
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">
              {openIncidents.length} open • {criticalIncidents.length} critical
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {openIncidents.slice(0, 5).map(incident => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "p-3 border-b border-border cursor-pointer hover:bg-card transition-colors",
                  selectedIncident?.id === incident.id && "bg-card"
                )}
                onClick={() => setSelectedIncident(incident)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-bold text-foreground">{incident.serviceName}</span>
                  <span className={cn(
                    "text-[9px] font-mono px-2 py-0.5 rounded-sm",
                    incident.severity === 'critical' ? "bg-red-500/10 text-red-500" :
                    incident.severity === 'high' ? "bg-orange-500/10 text-orange-500" :
                    "bg-yellow-500/10 text-yellow-500"
                  )}>
                    {incident.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{incident.message}</p>
                <div className="flex items-center gap-2 mt-2 text-[9px] text-muted-foreground font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(incident.createdAt).toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Reasoning Chain - Middle Right */}
        <div className="col-span-5 row-span-3 bg-background overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              AI Reasoning Chain
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedIncident && orchestrationResults.has(selectedIncident.id) ? (
              <div className="space-y-3">
                {orchestrationResults.get(selectedIncident.id)!.analyses.map((analysis, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-3 bg-card border border-border rounded-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                        {analysis.agentType} Agent
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {analysis.confidence}% confidence
                      </span>
                    </div>
                    <div className="space-y-1">
                      {analysis.findings.slice(0, 2).map((finding, j) => (
                        <p key={j} className="text-[10px] text-foreground">
                          • {finding.title}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground font-mono uppercase">
                  Select incident to view AI analysis
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Remediation Queue - Bottom Left */}
        <div className="col-span-4 row-span-5 bg-background overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Remediation Queue
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedIncident && orchestrationResults.has(selectedIncident.id) ? (
              <div className="space-y-3">
                {orchestrationResults.get(selectedIncident.id)!.recommendations.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-3 bg-card border border-border rounded-sm hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[10px] font-bold text-foreground uppercase">
                        {rec.action.replace('_', ' ')}
                      </span>
                      <span className={cn(
                        "text-[9px] font-mono px-2 py-0.5 rounded-sm",
                        rec.riskLevel === 'low' ? "bg-primary/10 text-primary" :
                        rec.riskLevel === 'medium' ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-red-500/10 text-red-500"
                      )}>
                        {rec.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">{rec.description}</p>
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                      <span>Target: {rec.targetService}</span>
                      <span>{rec.confidence}% confidence</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground font-mono uppercase">
                  No pending actions
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Prediction Panel - Bottom Middle */}
        <div className="col-span-3 row-span-5 bg-background overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Predictions
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedIncident && orchestrationResults.has(selectedIncident.id) ? (
              <div className="space-y-3">
                {orchestrationResults.get(selectedIncident.id)!.predictions.map((pred, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-3 bg-card border border-border rounded-sm"
                  >
                    <div className="mb-2">
                      <span className="text-[10px] font-bold text-foreground">{pred.failureType}</span>
                      <p className="text-[9px] text-muted-foreground mt-1">{pred.targetService}</p>
                    </div>
                    <div className="space-y-1 text-[9px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Probability:</span>
                        <span className={cn(
                          "font-bold",
                          pred.probability > 80 ? "text-red-500" :
                          pred.probability > 50 ? "text-yellow-500" : "text-primary"
                        )}>
                          {pred.probability}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ETA:</span>
                        <span className="text-foreground">{pred.estimatedTime}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground font-mono uppercase">
                  No predictions available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Agent Activity Monitor - Bottom Right */}
        <div className="col-span-5 row-span-5 bg-background overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Agent Activity
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {['CPU', 'Network', 'Dependency', 'Correlation', 'RCA', 'Prediction', 'Recommendation'].map((agent, i) => (
                <motion.div
                  key={agent}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-2 bg-card border border-border rounded-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-mono text-foreground">{agent} Agent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-primary" />
                    <span className="text-[9px] text-muted-foreground font-mono">ACTIVE</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
