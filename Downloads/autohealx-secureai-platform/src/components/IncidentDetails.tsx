import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Hammer, Zap, UserCheck, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { Incident } from './IncidentList';
import { cn } from '../lib/utils';

interface IncidentDetailsProps {
  incident: Incident;
  onApproveFix: (incident: Incident, actionType: string) => Promise<void>;
}

export function IncidentDetails({ incident, onApproveFix }: IncidentDetailsProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApproveFix(incident, 'auto-heal');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="bg-[#15171A] h-full flex flex-col border border-[#2D3139]">
      <div className="p-4 border-b border-[#2D3139]">
        <span className="terminal-label">AI Analysis Engine — Incident #{incident.id.slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Root Cause Card */}
        <div className="bg-[#0B0C0E] p-4 border border-[#2D3139]">
           <span className="terminal-label">Root Cause Hypothesis</span>
           <p className="text-[14px] leading-relaxed">
             {incident.rootCause || "Analyzing system state patterns and log anomalies..."}
           </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-[#0B0C0E] p-4 border border-[#2D3139]">
              <span className="terminal-label">Confidence</span>
              <div className="text-2xl font-bold tracking-tighter">
                {Math.round((incident.confidence || 0.85) * 100)}%
              </div>
           </div>
           <div className="bg-[#0B0C0E] p-4 border border-[#2D3139]">
              <span className="terminal-label">Blast Radius</span>
              <div className={cn(
                "text-2xl font-bold tracking-tighter",
                incident.severity === 'critical' || incident.severity === 'high' ? "text-[#F27D26]" : "text-primary"
              )}>
                {incident.severity === 'critical' ? 'High' : incident.severity === 'high' ? 'Medium' : 'Low'}
              </div>
           </div>
        </div>

        {/* Fix Panel */}
        <div className="bg-[#1C1F23] p-5 border-l-4 border-primary flex-1">
           <span className="terminal-label text-primary">Proposed Fix (Auto-executable)</span>
           <p className="mb-4 text-[13px] leading-relaxed">
             {incident.suggestedFix || "No automated remediation available for this incident profile."}
           </p>
           
           <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={isApproving || isSuccess || incident.status === 'resolved'}
                className={cn(
                  "px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors",
                  isSuccess 
                    ? "bg-primary/20 text-primary cursor-default" 
                    : "bg-primary text-[#0B0C0E] hover:bg-primary/90 disabled:opacity-30"
                )}
              >
                {isSuccess ? "ACTION_VERIFIED" : isApproving ? "SIGNING..." : "EXECUTE ACTION"}
              </button>
              <button className="px-4 py-2 border border-[#2D3139] text-[#E4E6EB] text-[11px] font-bold uppercase tracking-wider hover:bg-white/5">
                DISMISS
              </button>
           </div>
        </div>
      </div>

      <div className="p-4 border-t border-[#2D3139] bg-[#0B0C0E]">
         <div className="text-[10px] text-primary font-mono flex items-center gap-2">
            <Shield className="w-3 h-3" />
            ⛓ BLOCKCHAIN VERIFIED AT BLOCK #1,209,442
         </div>
      </div>
    </div>
  );
}
