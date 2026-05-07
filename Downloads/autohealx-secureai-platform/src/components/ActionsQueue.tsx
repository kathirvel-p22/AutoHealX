import React from 'react';
import { Shield, Zap, CheckCircle2, XCircle, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { Incident } from './IncidentList';

interface ActionsQueueProps {
  incidents?: Incident[];
  onViewIncident?: (incidentId: string) => void;
}

const mockActions = [
  { id: '1', incidentId: 'mock-incident-1', title: 'Increase Upstream Timeout Threshold', status: 'pending', risk: 'low', description: 'Temporarily increase the gateway timeout settings to accommodate slower upstream responses during high load.' },
  { id: '2', incidentId: 'mock-incident-2', title: 'Adjust Timeout and Retry Policy', status: 'pending', risk: 'low', description: 'Incrementally increase the upstream timeout threshold and implement exponential backoff for retries to handle transient spikes.' },
  { id: '3', incidentId: 'mock-incident-3', title: 'Add Null Guards and Validation', status: 'approved', risk: 'low', description: 'Identify the code path leading to the NPE and implement robust null checks or use Optional types to handle missing values safely.' },
  { id: '4', incidentId: 'mock-incident-4', title: 'Clear Stale Locks', status: 'pending', risk: 'medium', description: 'Identify and manually release expired or orphaned locks in the distributed lock manager.' },
  { id: '5', incidentId: 'mock-incident-5', title: 'Increase Lock Timeout', status: 'pending', risk: 'low', description: 'Temporarily increase the acquisition timeout to allow slow processes to complete before failing subsequent requests.' },
];

export function ActionsQueue({ incidents = [], onViewIncident }: ActionsQueueProps) {
  const [activeFilter, setActiveFilter] = React.useState('ALL');

  // Map real incidents to actions if available, otherwise use mock data
  const allActions = incidents.length > 0 
    ? incidents.slice(0, 5).map((incident, index) => ({
        id: incident.id,
        incidentId: incident.id,
        title: incident.suggestedFix || mockActions[index]?.title || 'Remediation Action',
        status: incident.status === 'resolved' ? 'executed' : 'pending',
        risk: incident.severity === 'critical' ? 'high' : incident.severity === 'high' ? 'medium' : 'low',
        description: incident.rootCause || mockActions[index]?.description || 'Automated remediation action'
      }))
    : mockActions;

  // Filter actions based on active filter
  const filteredActions = activeFilter === 'ALL' 
    ? allActions 
    : allActions.filter(action => action.status.toUpperCase() === activeFilter);

  const handleViewIncident = (incidentId: string) => {
    if (onViewIncident) {
      onViewIncident(incidentId);
    }
  };

  return (
    <div className="bg-[#0B0C0E] border border-[#2D3139] p-6 rounded-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
           <div className="flex items-center gap-2 text-primary font-mono text-[11px] mb-1">
              <span>//</span>
              <span>SIGNED REMEDIATIONS</span>
           </div>
           <h2 className="text-xl font-bold uppercase tracking-tight">Actions Queue</h2>
           <p className="text-[10px] text-gray-500 font-mono mt-1 tracking-widest uppercase">// approval workflow</p>
        </div>
        <div className="flex p-1 bg-[#1C1F23] border border-[#2D3139] rounded">
           {['ALL', 'PENDING', 'APPROVED', 'EXECUTED', 'REJECTED'].map(f => (
             <button
               key={f}
               onClick={() => setActiveFilter(f)}
               className={cn(
                 "px-3 py-1 text-[10px] font-bold uppercase transition-all rounded-[2px]",
                 activeFilter === f ? "bg-primary text-[#0B0C0E]" : "text-[#8E9299] hover:text-white"
               )}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
         {filteredActions.length > 0 ? (
           filteredActions.map((action) => (
             <div key={action.id} className="bg-[#15171A] border border-[#2D3139] p-5 rounded-sm hover:border-[#3D424D] transition-colors group">
                <div className="flex items-start justify-between">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                         <h3 className="text-sm font-bold text-white uppercase tracking-tight">{action.title}</h3>
                         <div className="flex gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded-[2px] text-[9px] font-bold uppercase",
                              action.status === 'approved' ? "bg-primary/20 text-primary" : 
                              action.status === 'executed' ? "bg-primary/30 text-primary" :
                              "bg-[#1C1F23] text-gray-500"
                            )}>{action.status}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-[2px] text-[9px] font-bold uppercase",
                              action.risk === 'low' ? "bg-primary/10 text-primary" : 
                              action.risk === 'medium' ? "bg-[#F27D26]/10 text-[#F27D26]" :
                              "bg-red-500/10 text-red-500"
                            )}>{action.risk} risk</span>
                         </div>
                      </div>
                      <p className="text-xs text-[#8E9299] leading-relaxed mb-4 max-w-2xl">
                         {action.description}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-gray-600">
                         <span># {action.incidentId.slice(0, 8)}...</span>
                         <button
                           onClick={() => handleViewIncident(action.incidentId)}
                           className="flex items-center gap-1 text-primary cursor-pointer hover:underline underline-offset-2 transition-all hover:gap-2"
                         >
                            <Play className="w-2 h-2" /> view incident
                         </button>
                      </div>
                   </div>
                   
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1F23] border border-primary/30 text-primary text-[10px] font-bold uppercase hover:bg-primary/10 transition-colors">
                         <CheckCircle2 className="w-3 h-3" /> approve
                      </button>
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1F23] border border-red-500/30 text-red-500 text-[10px] font-bold uppercase hover:bg-red-500/10 transition-colors">
                         <XCircle className="w-3 h-3" /> reject
                      </button>
                   </div>
                </div>
             </div>
           ))
         ) : (
           <div className="flex flex-col items-center justify-center h-64 border border-dashed border-[#2D3139] rounded-sm">
              <Shield className="w-12 h-12 text-gray-600 mb-4 opacity-50" />
              <p className="text-sm text-gray-500 font-mono uppercase tracking-widest">
                No {activeFilter.toLowerCase()} actions found
              </p>
           </div>
         )}
      </div>
    </div>
  );
}
