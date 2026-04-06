export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: 'admin' | 'user';
}

export interface Device {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'warning';
  lastSeen: string;
  userId: string;
  mode: 'suggest' | 'auto';
}

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  description: string;
  solution: string;
  category: 'performance' | 'security' | 'network';
  confidence: number;
}

export interface ActionLog {
  id: string;
  deviceId: string;
  action: string;
  result: 'success' | 'failure';
  timestamp: any;
  details: string;
}

export interface Metric {
  id?: string;
  deviceId: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  gpu: number;
  wifi: number;
  timestamp: any; // Firestore Timestamp
}

export interface Alert {
  id?: string;
  deviceId: string;
  type: 'HIGH_CPU' | 'HIGH_MEMORY' | 'TREND_OVERLOAD';
  message: string;
  status: 'pending' | 'resolved';
  timestamp: any; // Firestore Timestamp
  actionTaken?: string;
}

export interface Command {
  id?: string;
  deviceId: string;
  action: 'KILL_PROCESS' | 'RESTART_SERVICE' | 'CLEAN_CACHE' | 'STRESS_TEST';
  target: string;
  status: 'pending' | 'done';
  timestamp: any; // Firestore Timestamp
}

export interface Process {
  name: string;
  pid: number;
  cpu: number;
  mem: string;
  status: string;
}
