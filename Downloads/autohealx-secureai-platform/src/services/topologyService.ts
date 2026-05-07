/**
 * Topology Service
 * Simulates Kubernetes cluster topology and dependencies
 */

import { TopologyGraph, TopologyNode, DependencyEdge, ServiceStatus } from '../types/topology';

// Simulated microservices architecture
const MOCK_SERVICES: Omit<TopologyNode, 'position' | 'lastUpdated'>[] = [
  {
    id: 'api-gateway',
    name: 'API Gateway',
    type: 'gateway',
    status: 'healthy',
    namespace: 'production',
    metrics: { cpu: 15, memory: 512, requests: 1250, latency: 45, errorRate: 0.2 },
    dependencies: ['auth-service', 'user-service', 'payment-service'],
    replicas: 3,
    version: 'v2.4.1'
  },
  {
    id: 'auth-service',
    name: 'Auth Service',
    type: 'service',
    status: 'healthy',
    namespace: 'production',
    metrics: { cpu: 8, memory: 256, requests: 450, latency: 12, errorRate: 0.1 },
    dependencies: ['redis-cache', 'postgres-db'],
    replicas: 2,
    version: 'v1.8.3'
  },
  {
    id: 'user-service',
    name: 'User Service',
    type: 'service',
    status: 'healthy',
    namespace: 'production',
    metrics: { cpu: 12, memory: 384, requests: 680, latency: 28, errorRate: 0.3 },
    dependencies: ['postgres-db', 'redis-cache'],
    replicas: 3,
    version: 'v3.1.0'
  },
  {
    id: 'payment-service',
    name: 'Payment Service',
    type: 'service',
    status: 'degraded',
    namespace: 'production',
    metrics: { cpu: 45, memory: 768, requests: 320, latency: 180, errorRate: 2.1 },
    dependencies: ['postgres-db', 'rabbitmq-queue', 'stripe-gateway'],
    replicas: 2,
    version: 'v2.0.5'
  },
  {
    id: 'notification-service',
    name: 'Notification Service',
    type: 'service',
    status: 'healthy',
    namespace: 'production',
    metrics: { cpu: 6, memory: 192, requests: 180, latency: 35, errorRate: 0.5 },
    dependencies: ['rabbitmq-queue', 'redis-cache'],
    replicas: 2,
    version: 'v1.5.2'
  },
  {
    id: 'analytics-service',
    name: 'Analytics Service',
    type: 'service',
    status: 'healthy',
    namespace: 'production',
    metrics: { cpu: 22, memory: 1024, requests: 95, latency: 420, errorRate: 0.8 },
    dependencies: ['clickhouse-db', 'kafka-queue'],
    replicas: 1,
    version: 'v1.2.0'
  },
  {
    id: 'postgres-db',
    name: 'PostgreSQL',
    type: 'database',
    status: 'healthy',
    namespace: 'data',
    metrics: { cpu: 35, memory: 2048, requests: 1850, latency: 8, errorRate: 0.1 },
    dependencies: [],
    replicas: 1,
    version: '14.5'
  },
  {
    id: 'redis-cache',
    name: 'Redis Cache',
    type: 'cache',
    status: 'healthy',
    namespace: 'data',
    metrics: { cpu: 18, memory: 512, requests: 3200, latency: 2, errorRate: 0.05 },
    dependencies: [],
    replicas: 1,
    version: '7.0'
  },
  {
    id: 'rabbitmq-queue',
    name: 'RabbitMQ',
    type: 'queue',
    status: 'healthy',
    namespace: 'messaging',
    metrics: { cpu: 12, memory: 384, requests: 520, latency: 15, errorRate: 0.2 },
    dependencies: [],
    replicas: 1,
    version: '3.11'
  },
  {
    id: 'kafka-queue',
    name: 'Kafka',
    type: 'queue',
    status: 'healthy',
    namespace: 'messaging',
    metrics: { cpu: 28, memory: 1536, requests: 850, latency: 25, errorRate: 0.3 },
    dependencies: [],
    replicas: 3,
    version: '3.4'
  },
  {
    id: 'clickhouse-db',
    name: 'ClickHouse',
    type: 'database',
    status: 'healthy',
    namespace: 'data',
    metrics: { cpu: 42, memory: 3072, requests: 125, latency: 95, errorRate: 0.4 },
    dependencies: [],
    replicas: 1,
    version: '23.3'
  },
  {
    id: 'stripe-gateway',
    name: 'Stripe Gateway',
    type: 'gateway',
    status: 'healthy',
    namespace: 'external',
    metrics: { cpu: 5, memory: 128, requests: 280, latency: 320, errorRate: 1.2 },
    dependencies: [],
    replicas: 1,
    version: 'external'
  }
];

// Generate dependency edges
function generateEdges(nodes: TopologyNode[]): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  
  nodes.forEach(node => {
    node.dependencies.forEach(depId => {
      const targetNode = nodes.find(n => n.id === depId);
      if (targetNode) {
        const traffic = Math.floor(node.metrics.requests * (0.3 + Math.random() * 0.4));
        const latency = Math.floor(10 + Math.random() * 50);
        const errorRate = Math.random() * 2;
        
        edges.push({
          id: `${node.id}-${depId}`,
          source: node.id,
          target: depId,
          type: targetNode.type === 'database' ? 'database' : 
                targetNode.type === 'cache' ? 'cache' :
                targetNode.type === 'queue' ? 'queue' : 'http',
          traffic,
          latency,
          errorRate,
          status: errorRate > 1.5 ? 'failing' : latency > 100 ? 'slow' : 'healthy'
        });
      }
    });
  });
  
  return edges;
}

// Calculate force-directed layout positions
function calculateLayout(nodes: Omit<TopologyNode, 'position' | 'lastUpdated'>[]): TopologyNode[] {
  const width = 1200;
  const height = 800;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Group nodes by type for better layout
  const gateways = nodes.filter(n => n.type === 'gateway');
  const services = nodes.filter(n => n.type === 'service');
  const databases = nodes.filter(n => n.type === 'database');
  const caches = nodes.filter(n => n.type === 'cache');
  const queues = nodes.filter(n => n.type === 'queue');
  
  const positioned: TopologyNode[] = [];
  
  // Position gateways at top
  gateways.forEach((node, i) => {
    positioned.push({
      ...node,
      position: { x: centerX + (i - gateways.length / 2) * 200, y: 100 },
      lastUpdated: new Date().toISOString()
    });
  });
  
  // Position services in middle layer
  services.forEach((node, i) => {
    const angle = (i / services.length) * Math.PI * 2;
    const radius = 250;
    positioned.push({
      ...node,
      position: { 
        x: centerX + Math.cos(angle) * radius, 
        y: centerY + Math.sin(angle) * radius 
      },
      lastUpdated: new Date().toISOString()
    });
  });
  
  // Position data layer at bottom
  const dataNodes = [...databases, ...caches, ...queues];
  dataNodes.forEach((node, i) => {
    positioned.push({
      ...node,
      position: { x: 200 + i * 180, y: height - 150 },
      lastUpdated: new Date().toISOString()
    });
  });
  
  return positioned;
}

export class TopologyService {
  private static instance: TopologyService;
  private topology: TopologyGraph | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  
  private constructor() {}
  
  static getInstance(): TopologyService {
    if (!TopologyService.instance) {
      TopologyService.instance = new TopologyService();
    }
    return TopologyService.instance;
  }
  
  /**
   * Get current topology graph
   */
  getTopology(): TopologyGraph {
    if (!this.topology) {
      this.topology = this.generateTopology();
    }
    return this.topology;
  }
  
  /**
   * Generate fresh topology with current metrics
   */
  private generateTopology(): TopologyGraph {
    const nodes = calculateLayout(MOCK_SERVICES);
    const edges = generateEdges(nodes);
    
    // Calculate cluster health
    const avgHealth = nodes.reduce((sum, node) => {
      const health = node.status === 'healthy' ? 100 :
                    node.status === 'degraded' ? 70 :
                    node.status === 'critical' ? 40 : 10;
      return sum + health;
    }, 0) / nodes.length;
    
    return {
      nodes,
      edges,
      lastUpdated: new Date().toISOString(),
      clusterHealth: Math.round(avgHealth)
    };
  }
  
  /**
   * Simulate metric updates
   */
  private updateMetrics() {
    if (!this.topology) return;
    
    this.topology.nodes.forEach(node => {
      // Simulate metric fluctuations
      node.metrics.cpu += (Math.random() - 0.5) * 5;
      node.metrics.cpu = Math.max(0, Math.min(100, node.metrics.cpu));
      
      node.metrics.memory += (Math.random() - 0.5) * 50;
      node.metrics.memory = Math.max(0, node.metrics.memory);
      
      node.metrics.requests += (Math.random() - 0.5) * 20;
      node.metrics.requests = Math.max(0, node.metrics.requests);
      
      node.metrics.latency += (Math.random() - 0.5) * 10;
      node.metrics.latency = Math.max(1, node.metrics.latency);
      
      node.metrics.errorRate += (Math.random() - 0.5) * 0.2;
      node.metrics.errorRate = Math.max(0, Math.min(10, node.metrics.errorRate));
      
      // Update status based on metrics
      if (node.metrics.cpu > 80 || node.metrics.errorRate > 5) {
        node.status = 'critical';
      } else if (node.metrics.cpu > 60 || node.metrics.errorRate > 2) {
        node.status = 'degraded';
      } else {
        node.status = 'healthy';
      }
      
      node.lastUpdated = new Date().toISOString();
    });
    
    // Update edges
    this.topology.edges.forEach(edge => {
      edge.traffic += (Math.random() - 0.5) * 10;
      edge.traffic = Math.max(0, edge.traffic);
      
      edge.latency += (Math.random() - 0.5) * 5;
      edge.latency = Math.max(1, edge.latency);
      
      edge.errorRate += (Math.random() - 0.5) * 0.3;
      edge.errorRate = Math.max(0, Math.min(10, edge.errorRate));
      
      edge.status = edge.errorRate > 1.5 ? 'failing' : 
                   edge.latency > 100 ? 'slow' : 'healthy';
    });
    
    this.topology.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Start real-time updates
   */
  startRealTimeUpdates(callback: (topology: TopologyGraph) => void) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
      if (this.topology) {
        callback(this.topology);
      }
    }, 2000); // Update every 2 seconds
  }
  
  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  /**
   * Get service by ID
   */
  getService(id: string): TopologyNode | undefined {
    return this.topology?.nodes.find(n => n.id === id);
  }
  
  /**
   * Get dependencies for a service
   */
  getDependencies(serviceId: string): TopologyNode[] {
    const service = this.getService(serviceId);
    if (!service || !this.topology) return [];
    
    return service.dependencies
      .map(depId => this.topology!.nodes.find(n => n.id === depId))
      .filter(Boolean) as TopologyNode[];
  }
  
  /**
   * Get dependents (services that depend on this service)
   */
  getDependents(serviceId: string): TopologyNode[] {
    if (!this.topology) return [];
    
    return this.topology.nodes.filter(node => 
      node.dependencies.includes(serviceId)
    );
  }
}

export const topologyService = TopologyService.getInstance();
