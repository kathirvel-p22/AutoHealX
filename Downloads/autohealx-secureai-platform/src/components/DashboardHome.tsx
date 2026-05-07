import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, Brain, CheckCircle2, Zap, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { SystemStatusOverview } from './dashboard/SystemStatusOverview';

const data = [
  { time: '06:00', s1: 0, s2: 0, s3: 0, s4: 0 },
  { time: '07:00', s1: 0, s2: 0, s3: 0, s4: 1 },
  { time: '08:00', s1: 0, s2: 0, s3: 1, s4: 2 },
  { time: '09:00', s1: 0, s2: 1, s3: 1, s4: 2 },
  { time: '10:00', s1: 0, s2: 1, s3: 2, s4: 3 },
  { time: '11:00', s1: 0, s2: 1, s3: 3, s4: 4 },
  { time: '12:00', s1: 1, s2: 2, s3: 4, s4: 5 },
  { time: '13:00', s1: 1, s2: 2, s3: 3, s4: 4 },
  { time: '14:00', s1: 1, s2: 3, s3: 4, s4: 5 },
  { time: '15:00', s1: 2, s2: 4, s3: 5, s4: 6 },
  { time: '16:00', s1: 5, s2: 6, s3: 7, s4: 8 },
  { time: '17:00', s1: 9, s2: 12, s3: 8, s4: 10 },
];

const serviceStatus = [
  { 
    name: 'API-GATEWAY', 
    status: 'HEALTHY', 
    metrics: [
      { cpu: 12, mem: 45, net: 20 },
      { cpu: 15, mem: 46, net: 25 },
      { cpu: 11, mem: 45, net: 22 },
      { cpu: 18, mem: 47, net: 30 },
      { cpu: 14, mem: 45, net: 28 },
      { cpu: 16, mem: 46, net: 25 }
    ]
  },
  { 
    name: 'AUTH-SERVICE', 
    status: 'HEALTHY', 
    metrics: [
      { cpu: 8, mem: 30, net: 5 },
      { cpu: 10, mem: 31, net: 8 },
      { cpu: 7, mem: 30, net: 6 },
      { cpu: 12, mem: 32, net: 10 },
      { cpu: 9, mem: 30, net: 7 },
      { cpu: 11, mem: 31, net: 9 }
    ]
  },
  { 
    name: 'DATA-PROCESSOR', 
    status: 'STABLE', 
    metrics: [
      { cpu: 65, mem: 80, net: 120 },
      { cpu: 70, mem: 82, net: 135 },
      { cpu: 62, mem: 80, net: 125 },
      { cpu: 75, mem: 85, net: 150 },
      { cpu: 68, mem: 81, net: 140 },
      { cpu: 72, mem: 83, net: 145 }
    ]
  }
];

function Sparkline({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) {
  return (
    <div className="h-6 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            fill={color} 
            fillOpacity={0.1} 
            strokeWidth={1.5} 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardHome({ incidents }: { incidents: any[] }) {
  const openIncidents = incidents.filter(i => i.status === 'open');
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved');
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status === 'open');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* System Status Overview */}
      <div className="mb-8">
        <SystemStatusOverview
          clusterHealth={98}
          activeIncidents={openIncidents.length + 12}
          criticalIncidents={criticalIncidents.length + 9}
          mttr="2.37m"
        />
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-6 gap-px bg-[#2D3139] border border-[#2D3139] mb-8">
        <div className="bg-[#15171A] p-5">
           <span className="terminal-label">MTTR</span>
           <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-primary">2.37m</span>
           </div>
           <p className="text-[10px] text-gray-500 font-mono mt-1">avg resolution</p>
        </div>
        <div className="bg-[#15171A] p-5">
           <span className="terminal-label">OPEN</span>
           <div className="text-2xl font-bold text-white">{openIncidents.length + 12}</div>
           <p className="text-[10px] text-gray-500 font-mono mt-1">of {incidents.length + 13} total</p>
        </div>
        <div className="bg-[#15171A] p-5">
           <span className="terminal-label">S1 ACTIVE</span>
           <div className="text-2xl font-bold text-red-500">{criticalIncidents.length + 9}</div>
           <p className="text-[10px] text-gray-500 font-mono mt-1">critical severity</p>
        </div>
        <div className="bg-[#15171A] p-5">
           <span className="terminal-label">ACCEPTANCE</span>
           <div className="text-2xl font-bold text-primary">100%</div>
           <p className="text-[10px] text-gray-500 font-mono mt-1">AI suggestions</p>
        </div>
        <div className="bg-[#15171A] p-5">
           <span className="terminal-label">EXECUTED</span>
           <div className="text-2xl font-bold text-white uppercase">{resolvedIncidents.length}</div>
           <p className="text-[10px] text-gray-500 font-mono mt-1">signed actions</p>
        </div>
        <div className="bg-[#15171A] p-5">
           <span className="terminal-label">UPTIME</span>
           <div className="text-2xl font-bold text-primary">99.95%</div>
           <p className="text-[10px] text-gray-500 font-mono mt-1">rolling 30d</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[1fr,300px] gap-8 overflow-hidden">
        {/* Left Side: Chart & Table */}
        <div className="flex flex-col gap-8 overflow-hidden">
           {/* Timeline Chart */}
           <div className="bg-[#15171A] border border-[#2D3139] p-6 rounded-sm">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">12H Incident Timeline</p>
                    <div className="flex items-center gap-2 mt-1">
                       <Activity className="w-4 h-4 text-primary" />
                       <h3 className="text-lg font-bold uppercase tracking-tight">Severity flow</h3>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    {['S1', 'S2', 'S3', 'S4'].map((s, i) => (
                      <div key={s} className="flex items-center gap-2">
                         <div className={cn("w-2 h-2 rounded-sm", 
                           i === 0 ? "bg-red-500" : i === 1 ? "bg-orange-500" : i === 2 ? "bg-yellow-500" : "bg-primary"
                         )} />
                         <span className="text-[10px] font-mono text-gray-400">{s}</span>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorS1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1C1F23" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#8E9299" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#8E9299" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#15171A', border: '1px solid #2D3139', fontSize: '10px' }}
                    />
                    <Area type="monotone" dataKey="s4" stroke="#00FFC2" fill="#00FFC2" fillOpacity={0.05} strokeWidth={2} />
                    <Area type="monotone" dataKey="s3" stroke="#eab308" fill="#eab308" fillOpacity={0.05} strokeWidth={2} />
                    <Area type="monotone" dataKey="s2" stroke="#f97316" fill="#f97316" fillOpacity={0.05} strokeWidth={2} />
                    <Area type="monotone" dataKey="s1" stroke="#ef4444" fill="url(#colorS1)" fillOpacity={1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Live Feed Placeholder */}
           <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                 <Zap className="w-4 h-4 text-primary" />
                 <h3 className="font-bold uppercase text-sm tracking-widest text-[#E4E6EB]">Active Systems</h3>
              </div>
              <div className="grid grid-cols-1 gap-px bg-[#2D3139] border border-[#2D3139] rounded-sm overflow-hidden">
                 {serviceStatus.map(service => (
                    <div key={service.name} className="bg-[#15171A] p-4 flex items-center justify-between group hover:bg-[#1C1F23] transition-colors">
                       <div className="flex items-center gap-6">
                          <div className="w-32">
                             <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Service</span>
                             <span className="text-xs font-bold text-white tracking-tight">{service.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-8">
                             <div>
                                <span className="text-[9px] font-mono text-gray-600 block mb-1 uppercase">CPU</span>
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-mono text-gray-300 w-8">{(service.metrics[service.metrics.length-1].cpu)}%</span>
                                   <Sparkline data={service.metrics} dataKey="cpu" color="#00FFC2" />
                                </div>
                             </div>
                             <div>
                                <span className="text-[9px] font-mono text-gray-600 block mb-1 uppercase">MEM</span>
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-mono text-gray-300 w-8">{(service.metrics[service.metrics.length-1].mem)}MB</span>
                                   <Sparkline data={service.metrics} dataKey="mem" color="#3b82f6" />
                                </div>
                             </div>
                             <div>
                                <span className="text-[9px] font-mono text-gray-600 block mb-1 uppercase">NET</span>
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-mono text-gray-300 w-8">{(service.metrics[service.metrics.length-1].net)}ms</span>
                                   <Sparkline data={service.metrics} dataKey="net" color="#f59e0b" />
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 px-3 py-1 bg-[#0B0C0E] border border-[#2D3139] rounded-[2px]">
                             <span className="text-[10px] font-mono text-primary font-bold">{service.status}</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Side: Trust Profile */}
        <div className="space-y-6">
           <div className="bg-[#15171A] border border-[#2D3139] p-6 rounded-sm">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex flex-col">
                    <span className="terminal-label !mb-0">TRUST POSTURE</span>
                    <h3 className="text-md font-bold flex items-center gap-2 uppercase tracking-tight">
                       <Shield className="w-4 h-4 text-primary" />
                       Crypto layer
                    </h3>
                 </div>
              </div>

              <div className="space-y-4">
                 {[
                   { label: 'SIGNATURE', value: 'Ed25519', icon: CheckCircle2 },
                   { label: 'HASHING', value: 'SHA-256', icon: CheckCircle2 },
                   { label: 'CHAIN', value: 'Append-only', icon: CheckCircle2 },
                   { label: 'RBAC', value: 'Active', icon: CheckCircle2 },
                   { label: 'AI MODEL', value: 'gemini-3-flash', icon: CheckCircle2 },
                 ].map((row) => (
                   <div key={row.label} className="flex items-center justify-between border-b border-[#2D3139] pb-3 last:border-0">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{row.label}</span>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-mono text-gray-300">{row.value}</span>
                         <row.icon className="w-3 h-3 text-primary" />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-[#15171A] border border-[#2D3139] p-6 rounded-sm overflow-hidden relative group cursor-crosshair">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded border border-primary/20">
                    <Brain className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Self-Healing</p>
                    <p className="text-xs font-bold text-white uppercase tracking-tight">Agentic Analysis</p>
                 </div>
              </div>
              <p className="text-[11px] text-[#8E9299] leading-relaxed mb-6 font-mono">
                 Processing log streams through RAG-enhanced vector stores to predict and mitigate S1/S2 events.
              </p>
              <div className="flex items-center justify-between text-[10px] font-mono">
                 <span className="text-primary font-bold">RUNNING</span>
                 <span className="text-gray-500">v4.0.2-FINAL</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
