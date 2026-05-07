/**
 * Correlation Timeline Component
 * Visual timeline showing event sequences and causal relationships
 */

import React from 'react';
import { motion } from 'motion/react';
import { Clock, AlertTriangle, Activity, TrendingUp, Zap } from 'lucide-react';
import { CorrelationResult, TimelineEvent } from '../../types/agents';
import { cn } from '../../lib/utils';

interface CorrelationTimelineProps {
  correlations: CorrelationResult[];
  onEventClick?: (event: TimelineEvent) => void;
}

const EventIcon = ({ severity }: { severity: string }) => {
  switch (severity) {
    case 'critical':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'error':
      return <Zap className="w-4 h-4 text-orange-500" />;
    case 'warning':
      return <TrendingUp className="w-4 h-4 text-yellow-500" />;
    default:
      return <Activity className="w-4 h-4 text-primary" />;
  }
};

export function CorrelationTimeline({ correlations, onEventClick }: CorrelationTimelineProps) {
  if (!correlations || correlations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground font-mono">No correlations detected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Event Correlation Timeline
        </h3>
        <p className="text-[10px] text-muted-foreground font-mono mt-1">
          {correlations.length} correlation{correlations.length !== 1 ? 's' : ''} detected
        </p>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-6">
        {correlations.map((correlation, corrIndex) => (
          <motion.div
            key={correlation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: corrIndex * 0.1 }}
            className="mb-8 last:mb-0"
          >
            {/* Correlation Header */}
            <div className="mb-4 p-3 bg-card border border-border rounded-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm",
                    correlation.relationship === 'causal' ? "bg-red-500/10 text-red-500" :
                    correlation.relationship === 'temporal' ? "bg-yellow-500/10 text-yellow-500" :
                    "bg-primary/10 text-primary"
                  )}>
                    {correlation.relationship}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {correlation.confidence}% confidence
                </span>
              </div>
              <p className="text-xs text-foreground">{correlation.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {correlation.events.map((event, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-sm font-mono">
                    {event}
                  </span>
                ))}
              </div>
            </div>

            {/* Timeline Events */}
            <div className="relative pl-8">
              {/* Vertical Line */}
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

              {correlation.timeline.map((event, eventIndex) => (
                <motion.div
                  key={eventIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: corrIndex * 0.1 + eventIndex * 0.05 }}
                  className="relative mb-4 last:mb-0"
                  onClick={() => onEventClick?.(event)}
                >
                  {/* Timeline Dot */}
                  <div className={cn(
                    "absolute left-[-1.75rem] top-2 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    event.severity === 'critical' ? "bg-red-500/20 border-red-500" :
                    event.severity === 'error' ? "bg-orange-500/20 border-orange-500" :
                    event.severity === 'warning' ? "bg-yellow-500/20 border-yellow-500" :
                    "bg-primary/20 border-primary"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      event.severity === 'critical' ? "bg-red-500" :
                      event.severity === 'error' ? "bg-orange-500" :
                      event.severity === 'warning' ? "bg-yellow-500" :
                      "bg-primary"
                    )} />
                  </div>

                  {/* Event Card */}
                  <div className="p-3 bg-card border border-border rounded-sm hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <EventIcon severity={event.severity} />
                        <span className="text-xs font-bold text-foreground">{event.service}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">{event.event}</p>
                    
                    {/* Metadata */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <span key={key} className="text-[9px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-sm font-mono">
                            {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Causal Arrow */}
                  {eventIndex < correlation.timeline.length - 1 && correlation.relationship === 'causal' && (
                    <div className="absolute left-[-1.5rem] top-full w-0.5 h-4 bg-gradient-to-b from-primary to-transparent" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
