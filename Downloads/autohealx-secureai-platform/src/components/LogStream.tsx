import React, { useState, useEffect } from 'react';
import { Shield, Terminal, Zap, Hash, Activity, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  service: string;
  userRole?: string;
  message: string;
  metadata?: any;
}

const initialLogs: LogEntry[] = [
  { id: '1', timestamp: '22:42:25', level: 'WARN', service: 'payment-service', userRole: 'ADMIN', message: 'Rate limit approaching for client 192.168.1.42' },
  { id: '2', timestamp: '22:42:25', level: 'WARN', service: 'payment-service', userRole: 'SECURITY', message: 'Cache miss rate above 60%' },
  { id: '3', timestamp: '22:42:25', level: 'ERROR', service: 'api-gateway', userRole: 'SRE', message: 'Timeout while calling upstream service' },
  { id: '4', timestamp: '22:42:25', level: 'WARN', service: 'payment-service', userRole: 'DEVELOPER', message: 'Rate limit approaching for client 192.168.1.42' },
  { id: '5', timestamp: '22:42:25', level: 'WARN', service: 'notification-service', userRole: 'SECURITY', message: 'Latency p99 exceeded 800ms threshold' },
  { id: '6', timestamp: '10:37:09', level: 'INFO', service: 'search-service', userRole: 'VIEWER', message: 'Request processed successfully in 42ms' },
  { id: '7', timestamp: '10:37:09', level: 'ERROR', service: 'search-service', userRole: 'ADMIN', message: 'Timeout while calling upstream service' },
  { id: '8', timestamp: '10:37:09', level: 'WARN', service: 'api-gateway', userRole: 'SRE', message: 'Cache miss rate above 60%' },
  { id: '9', timestamp: '10:37:09', level: 'INFO', service: 'notification-service', userRole: 'VIEWER', message: 'Healthcheck OK' },
  { id: '10', timestamp: '10:37:09', level: 'ERROR', service: 'db-service', userRole: 'SECURITY', message: 'Unhandled exception in request handler: NullPointerException' },
];

export function LogStream() {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [filter, setFilter] = useState('ALL');
  const [isPaused, setIsPaused] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [burstCount, setBurstCount] = useState(0);

  const services = ['payment-service', 'api-gateway', 'db-service', 'notification-service', 'search-service', 'auth-service', 'cache-service'];
  const roles = ['ADMIN', 'SRE', 'SECURITY', 'DEVELOPER', 'VIEWER', 'SYSTEM'];
  const errorMessages = [
    'Connection timeout to upstream service',
    'Database query exceeded 5s threshold',
    'Memory allocation failed - OOM detected',
    'Unhandled exception in request handler: NullPointerException',
    'Circuit breaker opened for downstream service',
    'Rate limit exceeded for client',
    'Authentication token expired',
    'Failed to acquire database connection from pool',
    'Kafka consumer lag exceeding 10000 messages',
    'Redis connection pool exhausted'
  ];
  const warnMessages = [
    'Cache miss rate above 60%',
    'Rate limit approaching for client',
    'Latency p99 exceeded 800ms threshold',
    'Disk usage above 75%',
    'Thread pool utilization at 85%',
    'Response time degradation detected',
    'Connection pool near capacity'
  ];
  const infoMessages = [
    'Request processed successfully',
    'Healthcheck OK',
    'Cache warmed successfully',
    'Deployment completed',
    'Configuration reloaded',
    'Metrics exported to Prometheus'
  ];

  const generateRandomLog = (): LogEntry => {
    const levels: Array<'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'> = ['INFO', 'WARN', 'ERROR', 'CRITICAL'];
    const weights = [0.4, 0.3, 0.25, 0.05]; // Probability distribution
    const random = Math.random();
    let level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' = 'INFO';
    
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        level = levels[i];
        break;
      }
    }

    const service = services[Math.floor(Math.random() * services.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    
    let message = '';
    if (level === 'ERROR' || level === 'CRITICAL') {
      message = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    } else if (level === 'WARN') {
      message = warnMessages[Math.floor(Math.random() * warnMessages.length)];
    } else {
      message = infoMessages[Math.floor(Math.random() * infoMessages.length)];
    }

    const now = new Date();
    const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    return {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp,
      level,
      service,
      userRole: role,
      message,
      metadata: {
        host: `node-${Math.floor(Math.random() * 10) + 1}`,
        requestId: Math.random().toString(36).substring(2, 15)
      }
    };
  };

  const handleSimulateBurst = async () => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    setBurstCount(prev => prev + 1);
    
    const burstSize = Math.floor(Math.random() * 30) + 20; // 20-50 logs
    const burstLogs: LogEntry[] = [];

    // Generate burst logs with cascading failure pattern
    const burstTemplates = [
      { level: 'CRITICAL' as const, service: 'payment-service', message: 'Connection pool exhausted - 0 available connections' },
      { level: 'ERROR' as const, service: 'payment-service', message: `Failed to process payment for order #${Math.floor(Math.random() * 10000)} - timeout after 5000ms` },
      { level: 'ERROR' as const, service: 'api-gateway', message: 'Circuit breaker OPEN for payment-service after 10 consecutive failures' },
      { level: 'CRITICAL' as const, service: 'database', message: 'Query execution time exceeded 10s threshold - potential deadlock' },
      { level: 'ERROR' as const, service: 'auth-service', message: 'Redis connection lost - falling back to database' },
      { level: 'WARN' as const, service: 'notification-service', message: 'Message queue depth at 95% capacity (9500/10000)' },
      { level: 'CRITICAL' as const, service: 'payment-service', message: 'Memory usage at 94% - GC overhead limit exceeded' },
      { level: 'ERROR' as const, service: 'user-service', message: 'Database connection timeout - max wait time exceeded' },
      { level: 'ERROR' as const, service: 'api-gateway', message: `Rate limit exceeded for IP 192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)} - 1000 req/min` },
      { level: 'CRITICAL' as const, service: 'payment-service', message: 'Service health check failed - marking as DOWN' },
      { level: 'ERROR' as const, service: 'cache-service', message: 'Redis cluster node unreachable - failover initiated' },
      { level: 'CRITICAL' as const, service: 'database', message: 'Connection pool saturation - rejecting new connections' },
      { level: 'ERROR' as const, service: 'notification-service', message: 'Kafka producer timeout - message delivery failed' },
      { level: 'WARN' as const, service: 'search-service', message: 'Elasticsearch cluster health degraded to YELLOW' },
      { level: 'ERROR' as const, service: 'api-gateway', message: 'Upstream service unavailable - returning 503' },
    ];

    // Generate burst logs with slight delays for realistic cascading effect
    for (let i = 0; i < burstSize; i++) {
      await new Promise(resolve => setTimeout(resolve, 80)); // 80ms between each log
      
      const template = burstTemplates[Math.floor(Math.random() * burstTemplates.length)];
      const now = new Date();
      const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      const newLog: LogEntry = {
        id: `burst-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        timestamp,
        level: template.level,
        service: template.service,
        userRole: roles[Math.floor(Math.random() * roles.length)],
        message: template.message,
        metadata: {
          host: `node-${Math.floor(Math.random() * 10) + 1}`,
          requestId: Math.random().toString(36).substring(2, 15),
          burstId: `burst-${burstCount + 1}`
        }
      };
      
      burstLogs.push(newLog);
      
      // Add logs incrementally for visual cascading effect
      setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 300)); // Keep max 300 logs
    }

    // Add a final summary log
    await new Promise(resolve => setTimeout(resolve, 200));
    const summaryLog: LogEntry = {
      id: `burst-summary-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      level: 'WARN',
      service: 'autohealx-monitor',
      userRole: 'SYSTEM',
      message: `⚡ Burst simulation completed: ${burstSize} error events generated in cascading failure pattern`,
      metadata: {
        burstId: `burst-${burstCount + 1}`,
        totalLogs: burstSize,
        criticalCount: burstLogs.filter(l => l.level === 'CRITICAL').length,
        errorCount: burstLogs.filter(l => l.level === 'ERROR').length
      }
    };
    
    setLogs(prevLogs => [summaryLog, ...prevLogs].slice(0, 300));
    setIsSimulating(false);
  };

  return (
    <div className="bg-[#0B0C0E] border border-[#2D3139] p-6 rounded-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
           <div className="flex items-center gap-2 text-primary font-mono text-[11px] mb-1">
              <span>//</span>
              <span>AUTOHEALX</span>
           </div>
           <h2 className="text-xl font-bold uppercase tracking-tight">Log Stream</h2>
           <p className="text-[10px] text-gray-500 font-mono mt-1 tracking-widest uppercase">// raw signal • normalized • ai-watched</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex p-1 bg-[#1C1F23] border border-[#2D3139] rounded">
              {['ALL', 'ERROR', 'CRITICAL', 'WARN', 'INFO'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold uppercase transition-all rounded-[2px]",
                    filter === f ? "bg-primary text-[#0B0C0E]" : "text-[#8E9299] hover:text-white"
                  )}
                >
                  {f}
                </button>
              ))}
           </div>
           <button 
             onClick={() => setIsPaused(!isPaused)}
             className="flex items-center gap-2 bg-[#1C1F23] border border-[#2D3139] px-4 py-2 text-xs font-bold uppercase hover:bg-white/5"
           >
              {isPaused ? 'RESUME' : 'PAUSE'}
           </button>
           <button 
             onClick={handleSimulateBurst}
             disabled={isSimulating}
             className={cn(
               "flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase transition-all relative overflow-hidden",
               isSimulating 
                 ? "bg-primary/80 text-[#0B0C0E] cursor-not-allowed" 
                 : "bg-primary text-[#0B0C0E] hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
             )}
           >
              {isSimulating && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              )}
              <Zap className={cn("w-4 h-4 relative z-10", isSimulating && "animate-pulse")} />
              <span className="relative z-10">{isSimulating ? 'SIMULATING...' : 'SIMULATE BURST'}</span>
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden border border-[#2D3139] bg-[#0c0d0e] flex flex-col relative group">
        <div className="p-3 border-b border-[#2D3139] flex justify-between items-center bg-[#15171A]">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest">STREAM LIVE</span>
           </div>
           <span className="text-[10px] font-mono text-gray-600">{logs.length} ENTRIES</span>
        </div>
        
        <div className="flex-1 overflow-y-auto font-mono text-[11px] custom-scrollbar">
           <table className="w-full border-collapse text-left">
               <thead className="text-[#8E9299] border-b border-[#2D3139] text-[10px] font-mono sticky top-0 bg-[#0c0d0e] z-10">
                  <tr>
                     <th className="py-2.5 px-6 font-normal">TIME</th>
                     <th className="py-2.5 px-6 font-normal">LEVEL</th>
                     <th className="py-2.5 px-6 font-normal">SERVICE</th>
                     <th className="py-2.5 px-6 font-normal">ROLE</th>
                     <th className="py-2.5 px-6 font-normal">MESSAGE</th>
                  </tr>
               </thead>
               <tbody className="text-[#8E9299]">
                 <AnimatePresence mode="popLayout">
                   {logs.filter(l => filter === 'ALL' || l.level === filter).map((log, i) => (
                     <motion.tr 
                       key={log.id} 
                       initial={{ opacity: 0, x: -20, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                       animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(255, 255, 255, 0)' }}
                       exit={{ opacity: 0, x: 20 }}
                       transition={{ duration: 0.3, delay: i * 0.02 }}
                       className="hover:bg-white/5 hover:text-white transition-colors cursor-pointer border-b border-[#1C1F23]"
                     >
                        <td className="py-2.5 px-6 whitespace-nowrap opacity-50">{log.timestamp}</td>
                        <td className={cn(
                          "py-2.5 px-6 font-bold whitespace-nowrap",
                          log.level === 'ERROR' || log.level === 'CRITICAL' ? "text-[#FF4444]" : 
                          log.level === 'WARN' ? "text-[#F27D26]" : "text-primary"
                        )}>{log.level}</td>
                        <td className="py-2.5 px-6 text-primary border-l- border-[#1C1F23] font-bold">{log.service}</td>
                        <td className="py-2.5 px-6 text-[9px] uppercase font-bold tracking-widest text-[#8E9299]">
                           {log.userRole || 'SYSTEM'}
                        </td>
                        <td className="py-2.5 px-6 flex-1 text-gray-300">{log.message}</td>
                     </motion.tr>
                   ))}
                 </AnimatePresence>
                 {!isSimulating && logs.length > 0 && (
                   <tr className="border-t border-[#1C1F23]">
                     <td colSpan={5} className="py-10 text-center animate-pulse">
                        <Terminal className="w-5 h-5 mx-auto mb-2 opacity-20" />
                        <span className="text-[10px] font-mono opacity-20">// awaiting stream injection...</span>
                     </td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
