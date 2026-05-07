/**
 * Topology & Dependency Types
 * Enterprise-grade infrastructure intelligence
 */

export type ServiceType = 'service' | 'database' | 'cache' | 'gateway' | 'queue' | 'storage';
export type ServiceStatus = 'healthy' | 'degraded' | 'critical' | 'down';
export type DependencyType = 'http' | 'grpc' | 'database' | 'cache' | 'queue';

export interface ServiceMetrics {
  cpu: number;          // Percentage
  memory: number;       // MB
  requests: number;     // Requests per second
  latency: number;      // Milliseconds
  errorRate: number;    // Percentage
}

export interface TopologyNode {
  id: string;
  name: string;
  type: ServiceType;
  status: ServiceStatus;
  namespace: string;
  metrics: ServiceMetrics;
  dependencies: string[];  // IDs of dependent services
  position: { x: number; y: number };
  replicas: number;
  version: string;
  lastUpdated: string;
}

export interface DependencyEdge {
  id: string;
  source: string;      // Source service ID
  target: string;      // Target service ID
  type: DependencyType;
  traffic: number;     // Requests per second
  latency: number;     // Average latency in ms
  errorRate: number;   // Percentage
  status: 'healthy' | 'slow' | 'failing';
}

export interface TopologyGraph {
  nodes: TopologyNode[];
  edges: DependencyEdge[];
  lastUpdated: string;
  clusterHealth: number;  // Overall health percentage
}

export interface TrafficFlow {
  edgeId: string;
  timestamp: string;
  volume: number;
  latency: number;
  errors: number;
}
