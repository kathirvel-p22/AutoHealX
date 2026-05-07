/**
 * Root Cause Analysis Visualization
 * Shows cascade chain and impact analysis
 */

import React from 'react';
import { motion } from 'motion/react';
import { Target, AlertCircle, TrendingDown, Shield, CheckCircle } from 'lucide-react';
import { RootCauseAnalysis } from '../../types/agents';
import { cn } from '../../lib/utils';

interface RootCauseVisualizationProps {
  rca: RootCauseAnalysis;
}

export function RootCauseVisualization({ rca }: RootCauseVisualizationProps) {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Root Cause Analysis
        </h3>
        <p className="text-[10px] text-muted-foreground font-mono mt-1">
          Confidence: {rca.confidence}%
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Root Service */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-500/10 border-2 border-red-500 rounded-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <span className="text-[10px] text-red-500 uppercase font-bold tracking-widest block">Root Service</span>
              <span className="text-sm font-bold text-foreground">{rca.rootService}</span>
            </div>
          </div>
          <div className="p-3 bg-card rounded-sm">
            <p className="text-xs text-foreground font-semibold mb-2">Root Cause:</p>
            <p className="text-xs text-muted-foreground">{rca.rootCause}</p>
          </div>
        </motion.div>

        {/* Cascade Chain */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-3 flex items-center gap-2">
            <TrendingDown className="w-3 h-3 text-primary" />
            Cascade Chain
          </h4>
          <div className="space-y-2">
            {rca.cascadeChain.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Connector Line */}
                {index > 0 && (
                  <div className="absolute left-4 -top-2 w-0.5 h-2 bg-border" />
                )}
                
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-sm border",
                  index === 0 ? "bg-red-500/5 border-red-500/30" :
                  index === rca.cascadeChain.length - 1 ? "bg-yellow-500/5 border-yellow-500/30" :
                  "bg-card border-border"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    index === 0 ? "bg-red-500/20 text-red-500" :
                    index === rca.cascadeChain.length - 1 ? "bg-yellow-500/20 text-yellow-500" :
                    "bg-primary/20 text-primary"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-foreground">{service}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {index === 0 ? 'Origin' :
                       index === rca.cascadeChain.length - 1 ? 'Final Impact' :
                       'Propagation'}
                    </p>
                  </div>
                  {index === 0 && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Evidence */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-3 h-3 text-primary" />
            Evidence
          </h4>
          <div className="space-y-2">
            {rca.evidence.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-2 p-2 bg-card border border-border rounded-sm"
              >
                <CheckCircle className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-[10px] text-muted-foreground font-mono">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Impacted Services */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-3">
            Impacted Services ({rca.impactedServices.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {rca.impactedServices.map((service, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] font-mono rounded-sm"
              >
                {service}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Reasoning */}
        <div className="p-4 bg-card border border-border rounded-sm">
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-2">
            AI Reasoning
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{rca.reasoning}</p>
        </div>

        {/* Confidence Meter */}
        <div className="p-4 bg-card border border-border rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Analysis Confidence
            </span>
            <span className="text-sm font-bold text-primary">{rca.confidence}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rca.confidence}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                rca.confidence >= 80 ? "bg-primary" :
                rca.confidence >= 60 ? "bg-yellow-500" :
                "bg-orange-500"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
