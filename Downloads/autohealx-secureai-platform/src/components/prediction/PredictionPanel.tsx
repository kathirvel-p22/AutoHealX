/**
 * Prediction Panel Component
 * Shows predictive failure analysis and forecasting
 */

import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, Clock, Target, Zap } from 'lucide-react';
import { Prediction } from '../../types/agents';
import { cn } from '../../lib/utils';

interface PredictionPanelProps {
  predictions: Prediction[];
  onPredictionClick?: (prediction: Prediction) => void;
}

export function PredictionPanel({ predictions, onPredictionClick }: PredictionPanelProps) {
  if (!predictions || predictions.length === 0) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Predictive Analysis
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-mono">No predictions available</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">System is stable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Predictive Analysis
        </h3>
        <p className="text-[10px] text-muted-foreground font-mono mt-1">
          {predictions.length} potential failure{predictions.length !== 1 ? 's' : ''} forecasted
        </p>
      </div>

      {/* Predictions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {predictions.map((prediction, index) => (
          <motion.div
            key={prediction.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onPredictionClick?.(prediction)}
            className={cn(
              "p-4 rounded-sm border cursor-pointer transition-all",
              prediction.probability > 80 ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50" :
              prediction.probability > 60 ? "bg-orange-500/5 border-orange-500/30 hover:border-orange-500/50" :
              prediction.probability > 40 ? "bg-yellow-500/5 border-yellow-500/30 hover:border-yellow-500/50" :
              "bg-card border-border hover:border-primary/50"
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={cn(
                    "w-4 h-4",
                    prediction.probability > 80 ? "text-red-500" :
                    prediction.probability > 60 ? "text-orange-500" :
                    prediction.probability > 40 ? "text-yellow-500" :
                    "text-primary"
                  )} />
                  <h4 className="text-xs font-bold text-foreground">{prediction.failureType}</h4>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">{prediction.targetService}</p>
              </div>
              <div className="text-right">
                <div className={cn(
                  "text-2xl font-black",
                  prediction.probability > 80 ? "text-red-500" :
                  prediction.probability > 60 ? "text-orange-500" :
                  prediction.probability > 40 ? "text-yellow-500" :
                  "text-primary"
                )}>
                  {prediction.probability}%
                </div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Probability</p>
              </div>
            </div>

            {/* Time to Failure */}
            <div className="flex items-center gap-2 mb-3 p-2 bg-background rounded-sm">
              <Clock className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">Estimated failure in:</span>
              <span className="text-[10px] font-bold text-foreground">{prediction.estimatedTime}</span>
            </div>

            {/* Reasoning */}
            <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
              {prediction.reasoning}
            </p>

            {/* Indicators */}
            {prediction.indicators && prediction.indicators.length > 0 && (
              <div className="mb-3">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Early Indicators:</p>
                <div className="space-y-1">
                  {prediction.indicators.slice(0, 3).map((indicator, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{indicator}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {prediction.recommendedActions && prediction.recommendedActions.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Recommended Actions:
                </p>
                <div className="flex flex-wrap gap-1">
                  {prediction.recommendedActions.slice(0, 2).map((action, i) => (
                    <span key={i} className="text-[9px] px-2 py-1 bg-primary/10 text-primary rounded-sm font-mono">
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence Bar */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Confidence</span>
                <span className="text-[9px] font-bold text-foreground">{prediction.confidence}%</span>
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${prediction.confidence}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={cn(
                    "h-full rounded-full",
                    prediction.confidence >= 80 ? "bg-primary" :
                    prediction.confidence >= 60 ? "bg-yellow-500" :
                    "bg-orange-500"
                  )}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Summary */}
      <div className="p-4 border-t border-border bg-card">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-red-500">
              {predictions.filter(p => p.probability > 80).length}
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Critical</p>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-500">
              {predictions.filter(p => p.probability > 60 && p.probability <= 80).length}
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">High</p>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">
              {predictions.filter(p => p.probability <= 60).length}
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Medium</p>
          </div>
        </div>
      </div>
    </div>
  );
}
