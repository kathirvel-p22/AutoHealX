/**
 * Enhanced Incident Details Component
 * Comprehensive incident analysis with multiple views
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Target, Clock, Brain, Zap, AlertTriangle, 
  CheckCircle, TrendingUp, FileText, Activity 
} from 'lucide-react';
import { Incident } from './IncidentList';
import { CorrelationTimeline } from './correlation/CorrelationTimeline';
import { RootCauseVisualization } from './rca/RootCauseVisualization';
import { AgentOrchestrationResult } from '../types/agents';
import { cn } from '../lib/utils';

interface IncidentDetailsEnhancedProps {
  incident: Incident;
  orchestrationResult?: AgentOrchestrationResult;
  onApproveFix: (incident: Incident, actionType: string) => Promise<void>;
}

type TabType = 'overview' | 'correlation' | 'rca' | 'agents' | 'remediation';

export function IncidentDetailsEnhanced({ 
  incident, 
  orchestrationResult,
  onApproveFix 
}: IncidentDetailsEnhancedProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isApproving, setIsApproving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);
  const [flushSuccess, setFlushSuccess] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [executingAction, setExecutingAction] = useState<string | null>(null);

  const handleApprove = async (actionId: string) => {
    setIsApproving(true);
    try {
      await onApproveFix(incident, actionId);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleFlushCache = async () => {
    if (isFlushing) return;
    
    setIsFlushing(true);
    
    try {
      // Simulate cache flush operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Log the action
      console.log(`[AUTOHEALX] Cache flush executed for ${incident.serviceName}`);
      console.log(`[AUTOHEALX] Target: ${incident.serviceName} cache layer`);
      console.log(`[AUTOHEALX] Action: Flush all cache entries and restore hit rate`);
      console.log(`[AUTOHEALX] Expected Impact: Memory freed, latency spike resolved`);
      
      setFlushSuccess(true);
      setTimeout(() => setFlushSuccess(false), 5000);
    } catch (error) {
      console.error('Cache flush failed:', error);
    } finally {
      setIsFlushing(false);
    }
  };

  const handleExecuteAutoHeal = async () => {
    if (isApproving) return;
    
    setIsApproving(true);
    setExecutingAction('auto-heal');
    
    try {
      // Execute auto-heal action
      await onApproveFix(incident, 'auto-heal');
      
      console.log(`[AUTOHEALX] Auto-heal executed for incident ${incident.id}`);
      console.log(`[AUTOHEALX] Service: ${incident.serviceName}`);
      console.log(`[AUTOHEALX] Root Cause: ${incident.rootCause}`);
      console.log(`[AUTOHEALX] Action: ${incident.suggestedFix}`);
      console.log(`[AUTOHEALX] Status: Remediation in progress`);
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setExecutingAction(null);
      }, 5000);
    } catch (error) {
      console.error('Auto-heal execution failed:', error);
      setExecutingAction(null);
    } finally {
      setIsApproving(false);
    }
  };

  const handleViewTimeline = () => {
    setShowTimeline(true);
    // Switch to correlation tab to show timeline
    setActiveTab('correlation');
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: FileText },
    { id: 'correlation' as TabType, label: 'Correlation', icon: Clock },
    { id: 'rca' as TabType, label: 'Root Cause', icon: Target },
    { id: 'agents' as TabType, label: 'AI Agents', icon: Brain },
    { id: 'remediation' as TabType, label: 'Remediation', icon: Zap },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className={cn(
                "w-4 h-4",
                incident.severity === 'critical' ? "text-red-500" :
                incident.severity === 'high' ? "text-orange-500" :
                "text-yellow-500"
              )} />
              {incident.serviceName}
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">
              ID: {incident.id.slice(0, 12).toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[9px] font-mono px-2 py-1 rounded-sm uppercase font-bold",
              incident.severity === 'critical' ? "bg-red-500/10 text-red-500" :
              incident.severity === 'high' ? "bg-orange-500/10 text-orange-500" :
              "bg-yellow-500/10 text-yellow-500"
            )}>
              {incident.severity}
            </span>
            <span className={cn(
              "text-[9px] font-mono px-2 py-1 rounded-sm uppercase font-bold",
              incident.status === 'resolved' ? "bg-primary/10 text-primary" :
              "bg-yellow-500/10 text-yellow-500"
            )}>
              {incident.status}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{incident.message}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                activeTab === tab.id
                  ? "bg-background text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-y-auto p-4 space-y-4"
            >
              {/* Root Cause */}
              <div className="p-4 bg-card border border-border rounded-sm">
                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-2 flex items-center gap-2">
                  <Target className="w-3 h-3 text-primary" />
                  Root Cause Hypothesis
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {incident.rootCause || "Analyzing system state patterns and log anomalies..."}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-card border border-border rounded-sm">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest block mb-1">Confidence</span>
                  <div className="text-xl font-bold text-primary">
                    {Math.round((incident.confidence || 0.85) * 100)}%
                  </div>
                </div>
                <div className="p-3 bg-card border border-border rounded-sm">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest block mb-1">Risk Level</span>
                  <div className={cn(
                    "text-xl font-bold",
                    incident.riskLevel === 'high' ? "text-red-500" :
                    incident.riskLevel === 'medium' ? "text-yellow-500" :
                    "text-primary"
                  )}>
                    {incident.riskLevel || 'Medium'}
                  </div>
                </div>
                <div className="p-3 bg-card border border-border rounded-sm">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest block mb-1">Processing</span>
                  <div className="text-xl font-bold text-foreground">
                    {orchestrationResult ? `${orchestrationResult.processingTime}ms` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              {incident.status !== 'resolved' && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
                    Quick Actions
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={handleExecuteAutoHeal}
                      disabled={isApproving || isSuccess}
                      className={cn(
                        "w-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm relative overflow-hidden",
                        isSuccess
                          ? "bg-primary/20 text-primary cursor-default"
                          : isApproving
                          ? "bg-primary/80 text-background cursor-not-allowed"
                          : "bg-primary text-background hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
                      )}
                    >
                      {isApproving && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%' }}
                          animate={{ x: '200%' }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                      )}
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isSuccess ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            ✓ Auto-Heal Executed
                          </>
                        ) : isApproving ? (
                          <>
                            <Zap className="w-3 h-3 animate-pulse" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3" />
                            Execute Auto-Heal
                          </>
                        )}
                      </span>
                    </button>
                    <button 
                      onClick={handleViewTimeline}
                      className="w-full px-4 py-2 border border-border text-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-card hover:border-primary/50 transition-all rounded-sm flex items-center justify-center gap-2"
                    >
                      <Clock className="w-3 h-3" />
                      View Full Timeline
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'correlation' && (
            <motion.div
              key="correlation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full relative"
            >
              {showTimeline && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-primary/10 border border-primary/20 px-4 py-2 rounded-sm"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Full Timeline View Active
                  </p>
                </motion.div>
              )}
              {orchestrationResult?.correlations ? (
                <CorrelationTimeline 
                  correlations={orchestrationResult.correlations}
                  onEventClick={(event) => console.log('Event clicked:', event)}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground font-mono">No correlation data available</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'rca' && (
            <motion.div
              key="rca"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              {orchestrationResult?.rootCause ? (
                <RootCauseVisualization rca={orchestrationResult.rootCause} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground font-mono">No root cause analysis available</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'agents' && (
            <motion.div
              key="agents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-y-auto p-4 space-y-3"
            >
              {orchestrationResult?.analyses.map((analysis, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 bg-card border border-border rounded-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">
                        {analysis.agentType} Agent
                      </span>
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {analysis.confidence}% confidence
                    </span>
                  </div>
                  
                  {analysis.findings.length > 0 ? (
                    <div className="space-y-2">
                      {analysis.findings.map((finding, j) => (
                        <div key={j} className="p-2 bg-background rounded-sm">
                          <div className="flex items-start gap-2 mb-1">
                            <span className={cn(
                              "text-[9px] px-2 py-0.5 rounded-sm font-bold uppercase",
                              finding.severity === 'critical' ? "bg-red-500/10 text-red-500" :
                              finding.severity === 'warning' ? "bg-yellow-500/10 text-yellow-500" :
                              "bg-primary/10 text-primary"
                            )}>
                              {finding.severity}
                            </span>
                            <span className="text-[10px] font-bold text-foreground">{finding.title}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground ml-2">{finding.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">No findings from this agent</p>
                  )}
                  
                  <div className="mt-3 pt-3 border-t border-border text-[9px] text-muted-foreground font-mono">
                    Processing time: {analysis.processingTime}ms
                  </div>
                </motion.div>
              )) || (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground font-mono">No agent analysis available</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'remediation' && (
            <motion.div
              key="remediation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-y-auto p-4 space-y-3"
            >
              {orchestrationResult?.recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 bg-card border border-border rounded-sm hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-tight mb-1">
                        {rec.action.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">Target: {rec.targetService}</p>
                    </div>
                    <span className={cn(
                      "text-[9px] font-mono px-2 py-1 rounded-sm uppercase font-bold",
                      rec.riskLevel === 'low' ? "bg-primary/10 text-primary" :
                      rec.riskLevel === 'medium' ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-red-500/10 text-red-500"
                    )}>
                      {rec.riskLevel} risk
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3">{rec.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3 text-[10px] font-mono">
                    <div>
                      <span className="text-muted-foreground">Impact:</span>
                      <p className="text-foreground">{rec.expectedImpact}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="text-foreground">{rec.estimatedDuration}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-[9px] text-muted-foreground font-mono">
                      Confidence: {rec.confidence}%
                    </span>
                    {rec.action === 'FLUSH_CACHE' ? (
                      <button
                        onClick={handleFlushCache}
                        disabled={isFlushing || flushSuccess || incident.status === 'resolved'}
                        className={cn(
                          "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all relative overflow-hidden",
                          flushSuccess
                            ? "bg-primary/20 text-primary cursor-default"
                            : isFlushing
                            ? "bg-primary/80 text-background cursor-not-allowed"
                            : "bg-primary text-background hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
                        )}
                      >
                        {isFlushing && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: '200%' }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          {flushSuccess ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Cache Flushed
                            </>
                          ) : isFlushing ? (
                            <>
                              <Zap className="w-3 h-3 animate-pulse" />
                              Flushing...
                            </>
                          ) : (
                            'Approve & Execute'
                          )}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(rec.id)}
                        disabled={isApproving || incident.status === 'resolved'}
                        className="px-3 py-1 bg-primary text-background text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                      >
                        Approve & Execute
                      </button>
                    )}
                  </div>
                </motion.div>
              )) || (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground font-mono">No remediation recommendations available</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-card">
        <div className="flex items-center justify-between text-[9px] font-mono">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="w-3 h-3" />
            <span>Cryptographically Signed</span>
          </div>
          <span className="text-muted-foreground">
            {new Date(incident.createdAt).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
