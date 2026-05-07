/**
 * System Status Overview
 * Comprehensive system health and status indicators
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle, AlertTriangle, XCircle, Clock, 
  Shield, Zap, Activity, TrendingUp, Server 
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SystemStatusOverviewProps {
  clusterHealth?: number;
  activeIncidents?: number;
  criticalIncidents?: number;
  mttr?: string;
}

export function SystemStatusOverview({ 
  clusterHealth = 98,
  activeIncidents = 3,
  criticalIncidents = 1,
  mttr = '2.37m'
}: SystemStatusOverviewProps) {
  const healthStatus = clusterHealth >= 95 ? 'excellent' : 
                      clusterHealth >= 85 ? 'good' : 
                      clusterHealth >= 70 ? 'degraded' : 'critical';

  const statusConfig = {
    excellent: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: CheckCircle },
    good: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle },
    degraded: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertTriangle },
    critical: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
  };

  const config = statusConfig[healthStatus];
  const StatusIcon = config.icon;

  const services = [
    { name: 'API Gateway', status: 'operational', uptime: '99.99%' },
    { name: 'Auth Service', status: 'operational', uptime: '99.98%' },
    { name: 'Payment Service', status: 'degraded', uptime: '98.50%' },
    { name: 'Database Cluster', status: 'operational', uptime: '99.95%' },
    { name: 'Cache Layer', status: 'operational', uptime: '99.99%' },
    { name: 'Message Queue', status: 'operational', uptime: '99.97%' },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Health Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-6 rounded-sm border-2",
          config.bg,
          config.border
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
              System Health
            </p>
            <div className="flex items-center gap-3">
              <StatusIcon className={cn("w-8 h-8", config.color)} />
              <div>
                <div className={cn("text-4xl font-black", config.color)}>
                  {clusterHealth}%
                </div>
                <p className={cn("text-xs uppercase tracking-widest font-bold", config.color)}>
                  {healthStatus}
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
              Status
            </p>
            <div className={cn(
              "px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-widest",
              config.bg,
              config.color
            )}>
              {healthStatus === 'excellent' || healthStatus === 'good' ? 'All Systems Operational' : 
               healthStatus === 'degraded' ? 'Partial Outage' : 'Major Outage'}
            </div>
          </div>
        </div>

        {/* Health Bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${clusterHealth}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              clusterHealth >= 95 ? "bg-primary" :
              clusterHealth >= 85 ? "bg-green-500" :
              clusterHealth >= 70 ? "bg-yellow-500" :
              "bg-red-500"
            )}
          />
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-card border border-border rounded-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">MTTR</p>
              <div className="text-xl font-black text-primary">{mttr}</div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Mean time to resolution</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-card border border-border rounded-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Active</p>
              <div className="text-xl font-black text-yellow-500">{activeIncidents}</div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Open incidents</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-card border border-border rounded-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Critical</p>
              <div className="text-xl font-black text-red-500">{criticalIncidents}</div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Severity S1/S2</p>
        </motion.div>
      </div>

      {/* Service Status List */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            Service Status
          </h4>
        </div>
        <div className="divide-y divide-border">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 hover:bg-background transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    service.status === 'operational' ? "bg-primary animate-pulse" :
                    service.status === 'degraded' ? "bg-yellow-500 animate-pulse" :
                    "bg-red-500 animate-pulse"
                  )} />
                  <span className="text-xs font-medium text-foreground">{service.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {service.uptime} uptime
                  </span>
                  <span className={cn(
                    "text-[9px] px-2 py-1 rounded-sm font-bold uppercase",
                    service.status === 'operational' ? "bg-primary/10 text-primary" :
                    service.status === 'degraded' ? "bg-yellow-500/10 text-yellow-500" :
                    "bg-red-500/10 text-red-500"
                  )}>
                    {service.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security & Compliance */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 bg-card border border-border rounded-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">
              Security Posture
            </h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Encryption:</span>
              <span className="text-primary font-bold">AES-256</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Signatures:</span>
              <span className="text-primary font-bold">Ed25519</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Audit Chain:</span>
              <span className="text-primary font-bold">Active</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-card border border-border rounded-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">
              AI Orchestration
            </h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Active Agents:</span>
              <span className="text-primary font-bold">13/13</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Avg Confidence:</span>
              <span className="text-primary font-bold">87%</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Response Time:</span>
              <span className="text-primary font-bold">{'<'}2s</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
