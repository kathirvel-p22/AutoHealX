/**
 * Topology Graph Component
 * Interactive infrastructure visualization with real-time updates
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Database, Zap, Server, Box, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { TopologyGraph as TopologyGraphType, TopologyNode, DependencyEdge } from '../../types/topology';
import { topologyService } from '../../services/topologyService';
import { cn } from '../../lib/utils';

interface TopologyGraphProps {
  onNodeSelect?: (node: TopologyNode) => void;
}

const ServiceIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'gateway':
      return <Zap className="w-5 h-5" />;
    case 'database':
      return <Database className="w-5 h-5" />;
    case 'cache':
      return <Box className="w-5 h-5" />;
    case 'queue':
      return <Activity className="w-5 h-5" />;
    default:
      return <Server className="w-5 h-5" />;
  }
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="w-3 h-3 text-primary" />;
    case 'degraded':
      return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
    case 'critical':
      return <XCircle className="w-3 h-3 text-red-500" />;
    default:
      return <XCircle className="w-3 h-3 text-gray-500" />;
  }
};

export function TopologyGraph({ onNodeSelect }: TopologyGraphProps) {
  const [topology, setTopology] = useState<TopologyGraphType | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Initial load
    const initialTopology = topologyService.getTopology();
    setTopology(initialTopology);

    // Start real-time updates
    topologyService.startRealTimeUpdates((updatedTopology) => {
      setTopology(updatedTopology);
    });

    return () => {
      topologyService.stopRealTimeUpdates();
    };
  }, []);

  const handleNodeClick = (node: TopologyNode) => {
    setSelectedNode(node.id);
    onNodeSelect?.(node);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(2, prev * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      isDragging.current = true;
      dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      setOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  if (!topology) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4"
          />
          <p className="text-sm text-muted-foreground font-mono">Mapping infrastructure...</p>
        </div>
      </div>
    );
  }

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-primary bg-primary/5';
      case 'degraded':
        return 'border-yellow-500 bg-yellow-500/5';
      case 'critical':
        return 'border-red-500 bg-red-500/5';
      default:
        return 'border-gray-500 bg-gray-500/5';
    }
  };

  const getEdgeColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#00FFC2';
      case 'slow':
        return '#eab308';
      case 'failing':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Live Topology Map
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono mt-1">
            {topology.nodes.length} services • {topology.edges.length} dependencies
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-card border border-border rounded-sm">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-mono text-primary font-bold">LIVE</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest block">Cluster Health</span>
            <span className={cn(
              "text-lg font-bold",
              topology.clusterHealth > 90 ? "text-primary" :
              topology.clusterHealth > 70 ? "text-yellow-500" : "text-red-500"
            )}>
              {topology.clusterHealth}%
            </span>
          </div>
        </div>
      </div>

      {/* Graph Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center'
          }}
        >
          {/* Grid Background */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Dependency Edges */}
          <g>
            {topology.edges.map(edge => {
              const sourceNode = topology.nodes.find(n => n.id === edge.source);
              const targetNode = topology.nodes.find(n => n.id === edge.target);
              
              if (!sourceNode || !targetNode) return null;

              const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target ||
                                   selectedNode === edge.source || selectedNode === edge.target;

              return (
                <g key={edge.id}>
                  {/* Edge line */}
                  <motion.line
                    x1={sourceNode.position.x}
                    y1={sourceNode.position.y}
                    x2={targetNode.position.x}
                    y2={targetNode.position.y}
                    stroke={getEdgeColor(edge.status)}
                    strokeWidth={isHighlighted ? 3 : 2}
                    strokeOpacity={isHighlighted ? 0.8 : 0.3}
                    strokeDasharray={edge.type === 'queue' ? '5,5' : '0'}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                  
                  {/* Traffic flow animation */}
                  {isHighlighted && (
                    <motion.circle
                      r="4"
                      fill={getEdgeColor(edge.status)}
                      initial={{ 
                        cx: sourceNode.position.x, 
                        cy: sourceNode.position.y 
                      }}
                      animate={{
                        cx: [sourceNode.position.x, targetNode.position.x],
                        cy: [sourceNode.position.y, targetNode.position.y]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Service Nodes */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center'
          }}
        >
          {topology.nodes.map(node => {
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            const isHighlighted = isSelected || isHovered;

            return (
              <motion.div
                key={node.id}
                className={cn(
                  "absolute cursor-pointer transition-all",
                  isHighlighted && "z-10"
                )}
                style={{
                  left: node.position.x - 60,
                  top: node.position.y - 40,
                  width: 120
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div className={cn(
                  "border-2 rounded-sm p-3 backdrop-blur-sm transition-all",
                  getNodeColor(node.status),
                  isHighlighted && "shadow-lg shadow-primary/20"
                )}>
                  {/* Node Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "p-1.5 rounded-sm",
                      node.status === 'healthy' ? "bg-primary/10 text-primary" :
                      node.status === 'degraded' ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-red-500/10 text-red-500"
                    )}>
                      <ServiceIcon type={node.type} />
                    </div>
                    <StatusIcon status={node.status} />
                  </div>

                  {/* Node Name */}
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-foreground truncate">{node.name}</p>
                    <p className="text-[8px] text-muted-foreground font-mono">{node.namespace}</p>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-1 text-[8px] font-mono">
                    <div>
                      <span className="text-muted-foreground">CPU:</span>
                      <span className={cn(
                        "ml-1 font-bold",
                        node.metrics.cpu > 80 ? "text-red-500" :
                        node.metrics.cpu > 60 ? "text-yellow-500" : "text-primary"
                      )}>
                        {Math.round(node.metrics.cpu)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">RPS:</span>
                      <span className="ml-1 font-bold text-foreground">{Math.round(node.metrics.requests)}</span>
                    </div>
                  </div>
                </div>

                {/* Tooltip on hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-card border border-border rounded-sm p-3 shadow-xl z-50"
                    >
                      <div className="space-y-2 text-[10px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Memory:</span>
                          <span className="text-foreground font-bold">{Math.round(node.metrics.memory)}MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Latency:</span>
                          <span className="text-foreground font-bold">{Math.round(node.metrics.latency)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Error Rate:</span>
                          <span className={cn(
                            "font-bold",
                            node.metrics.errorRate > 2 ? "text-red-500" : "text-primary"
                          )}>
                            {node.metrics.errorRate.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Replicas:</span>
                          <span className="text-foreground font-bold">{node.replicas}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Version:</span>
                          <span className="text-foreground font-bold">{node.version}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary" />
            <span className="text-muted-foreground">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-yellow-500/20 border border-yellow-500" />
            <span className="text-muted-foreground">Degraded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500" />
            <span className="text-muted-foreground">Critical</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(1)}
            className="px-3 py-1 bg-card border border-border rounded-sm text-[10px] font-mono hover:border-primary transition-colors"
          >
            Reset View
          </button>
          <span className="text-[10px] font-mono text-muted-foreground">
            Zoom: {Math.round(scale * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
