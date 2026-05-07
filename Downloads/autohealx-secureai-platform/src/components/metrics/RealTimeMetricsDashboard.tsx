/**
 * Real-Time Metrics Dashboard
 * Live system metrics and performance indicators
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Cpu, HardDrive, Network, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricData {
  timestamp: string;
  cpu: number;
  memory: number;
  network: number;
  requests: number;
}

interface SystemMetrics {
  cpu: { current: number; trend: 'up' | 'down' | 'stable'; history: number[] };
  memory: { current: number; trend: 'up' | 'down' | 'stable'; history: number[] };
  network: { current: number; trend: 'up' | 'down' | 'stable'; history: number[] };
  requests: { current: number; trend: 'up' | 'down' | 'stable'; history: number[] };
}

export function RealTimeMetricsDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { current: 45, trend: 'stable', history: [42, 43, 45, 44, 45] },
    memory: { current: 62, trend: 'up', history: [58, 59, 60, 61, 62] },
    network: { current: 1250, trend: 'stable', history: [1200, 1220, 1240, 1245, 1250] },
    requests: { current: 3420, trend: 'up', history: [3200, 3280, 3350, 3400, 3420] },
  });

  const [chartData, setChartData] = useState<MetricData[]>([]);

  useEffect(() => {
    // Initialize chart data
    const now = Date.now();
    const initialData: MetricData[] = Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(now - (19 - i) * 3000).toLocaleTimeString(),
      cpu: 40 + Math.random() * 20,
      memory: 55 + Math.random() * 15,
      network: 1000 + Math.random() * 500,
      requests: 3000 + Math.random() * 800,
    }));
    setChartData(initialData);

    // Update metrics every 2 seconds
    const interval = setInterval(() => {
      setMetrics(prev => {
        const newCpu = Math.max(0, Math.min(100, prev.cpu.current + (Math.random() - 0.5) * 10));
        const newMemory = Math.max(0, Math.min(100, prev.memory.current + (Math.random() - 0.5) * 5));
        const newNetwork = Math.max(0, prev.network.current + (Math.random() - 0.5) * 200);
        const newRequests = Math.max(0, prev.requests.current + (Math.random() - 0.5) * 300);

        return {
          cpu: {
            current: newCpu,
            trend: newCpu > prev.cpu.current ? 'up' : newCpu < prev.cpu.current ? 'down' : 'stable',
            history: [...prev.cpu.history.slice(-4), newCpu],
          },
          memory: {
            current: newMemory,
            trend: newMemory > prev.memory.current ? 'up' : newMemory < prev.memory.current ? 'down' : 'stable',
            history: [...prev.memory.history.slice(-4), newMemory],
          },
          network: {
            current: newNetwork,
            trend: newNetwork > prev.network.current ? 'up' : newNetwork < prev.network.current ? 'down' : 'stable',
            history: [...prev.network.history.slice(-4), newNetwork],
          },
          requests: {
            current: newRequests,
            trend: newRequests > prev.requests.current ? 'up' : newRequests < prev.requests.current ? 'down' : 'stable',
            history: [...prev.requests.history.slice(-4), newRequests],
          },
        };
      });

      setChartData(prev => {
        const newData = {
          timestamp: new Date().toLocaleTimeString(),
          cpu: metrics.cpu.current,
          memory: metrics.memory.current,
          network: metrics.network.current,
          requests: metrics.requests.current,
        };
        return [...prev.slice(-19), newData];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [metrics.cpu.current, metrics.memory.current, metrics.network.current, metrics.requests.current]);

  const MetricCard = ({ 
    title, 
    value, 
    unit, 
    trend, 
    icon: Icon, 
    color,
    history 
  }: { 
    title: string; 
    value: number; 
    unit: string; 
    trend: 'up' | 'down' | 'stable'; 
    icon: any; 
    color: string;
    history: number[];
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-card border border-border rounded-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-black", color)}>
              {typeof value === 'number' ? Math.round(value) : value}
            </span>
            <span className="text-xs text-muted-foreground">{unit}</span>
          </div>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          color.includes('primary') ? "bg-primary/10" :
          color.includes('yellow') ? "bg-yellow-500/10" :
          color.includes('blue') ? "bg-blue-500/10" :
          "bg-green-500/10"
        )}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
      </div>

      {/* Mini Sparkline */}
      <div className="h-8 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history.map((v, i) => ({ value: v, index: i }))}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color.includes('primary') ? '#00FFC2' : color.includes('yellow') ? '#eab308' : color.includes('blue') ? '#3b82f6' : '#22c55e'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color.includes('primary') ? '#00FFC2' : color.includes('yellow') ? '#eab308' : color.includes('blue') ? '#3b82f6' : '#22c55e'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color.includes('primary') ? '#00FFC2' : color.includes('yellow') ? '#eab308' : color.includes('blue') ? '#3b82f6' : '#22c55e'}
              fill={`url(#gradient-${title})`}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Indicator */}
      <div className="flex items-center gap-2">
        {trend === 'up' ? (
          <TrendingUp className="w-3 h-3 text-green-500" />
        ) : trend === 'down' ? (
          <TrendingDown className="w-3 h-3 text-red-500" />
        ) : (
          <Activity className="w-3 h-3 text-muted-foreground" />
        )}
        <span className={cn(
          "text-[9px] font-mono uppercase tracking-widest",
          trend === 'up' ? "text-green-500" :
          trend === 'down' ? "text-red-500" :
          "text-muted-foreground"
        )}>
          {trend}
        </span>
      </div>
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Real-Time System Metrics
        </h3>
        <p className="text-[10px] text-muted-foreground font-mono mt-1">
          Live performance indicators • Updated every 2s
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="CPU Usage"
          value={metrics.cpu.current}
          unit="%"
          trend={metrics.cpu.trend}
          icon={Cpu}
          color="text-primary"
          history={metrics.cpu.history}
        />
        <MetricCard
          title="Memory"
          value={metrics.memory.current}
          unit="%"
          trend={metrics.memory.trend}
          icon={HardDrive}
          color="text-yellow-500"
          history={metrics.memory.history}
        />
        <MetricCard
          title="Network"
          value={metrics.network.current}
          unit="MB/s"
          trend={metrics.network.trend}
          icon={Network}
          color="text-blue-500"
          history={metrics.network.history}
        />
        <MetricCard
          title="Requests"
          value={metrics.requests.current}
          unit="req/s"
          trend={metrics.requests.trend}
          icon={Zap}
          color="text-green-500"
          history={metrics.requests.history}
        />
      </div>

      {/* Main Chart */}
      <div className="flex-1 p-4">
        <div className="h-full bg-card border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">
              Performance Timeline
            </h4>
            <div className="flex items-center gap-4 text-[9px] font-mono">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm bg-primary" />
                <span className="text-muted-foreground">CPU</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm bg-yellow-500" />
                <span className="text-muted-foreground">Memory</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm bg-blue-500" />
                <span className="text-muted-foreground">Network</span>
              </div>
            </div>
          </div>
          
          <div className="h-[calc(100%-2rem)]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3139" vertical={false} />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#8E9299" 
                  fontSize={9} 
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#8E9299" 
                  fontSize={9} 
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#15171A', 
                    border: '1px solid #2D3139', 
                    borderRadius: '4px',
                    fontSize: '10px' 
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#00FFC2" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#eab308" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="network" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                  yAxisId={0}
                  hide
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
