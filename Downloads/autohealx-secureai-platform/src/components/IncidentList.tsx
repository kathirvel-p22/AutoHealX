import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Clock, Shield, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export interface Incident {
  id: string;
  serviceName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  message: string;
  rootCause?: string;
  suggestedFix?: string;
  confidence?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt?: string;
  signature?: string;
}

interface IncidentListProps {
  incidents: Incident[];
  onSelect: (incident: Incident) => void;
  selectedId?: string;
}

const severityConfig = {
  low: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', label: 'SOLVED' },
  medium: { color: 'text-[#F27D26]', bg: 'bg-[#F27D26]/10', border: 'border-[#F27D26]/20', label: 'PENDING' },
  high: { color: 'text-[#F27D26]', bg: 'bg-[#F27D26]/10', border: 'border-[#F27D26]/20', label: 'REVIEW' },
  critical: { color: 'text-[#FF4444]', bg: 'bg-[#FF4444]/10', border: 'border-[#FF4444]/20', label: 'CRITICAL' },
};

const statusIcons = {
  open: AlertCircle,
  investigating: Clock,
  resolved: CheckCircle2,
  dismissed: Shield,
};

export function IncidentList({ incidents, onSelect, selectedId }: IncidentListProps) {
  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 border border-dashed border-[#2D3139] rounded bg-[#0B0C0E]">
        <div className="terminal-label">No Active Stream</div>
      </div>
    );
  }

  return (
    <div className="space-y-px bg-[#2D3139]">
      <AnimatePresence initial={false}>
        {incidents.map((incident) => {
          const config = severityConfig[incident.severity];
          const isSelected = selectedId === incident.id;

          return (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => onSelect(incident)}
              className={cn(
                "group cursor-pointer grid grid-cols-[80px_1fr_100px] items-center py-2 px-3 transition-colors",
                isSelected ? "bg-[#1C1F23]" : "bg-[#0B0C0E] hover:bg-[#15171A]"
              )}
            >
              <div className="mono-text text-[#8E9299]">
                 {new Date(incident.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="flex flex-col min-w-0 pr-4">
                 <span className={cn("font-semibold truncate", isSelected ? "text-primary" : "text-[#E4E6EB]")}>
                    {incident.serviceName}: {incident.message}
                 </span>
                 <span className="text-[10px] mono-text text-[#8E9299] uppercase opacity-50">
                    HASH: {incident.id.slice(0, 12)}
                 </span>
              </div>
              <div className="flex justify-end">
                 <div className={cn("status-pill px-2 py-0.5 rounded text-[11px] font-mono font-bold border", config.color, config.bg, config.border)}>
                    {config.label}
                 </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
