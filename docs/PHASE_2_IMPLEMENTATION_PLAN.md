# Phase 2: Agent Integration & Real-Time Infrastructure Communication
## IMPLEMENTATION PLAN

**Date:** August 25, 2026  
**Status:** PLANNING COMPLETE - READY FOR IMPLEMENTATION  
**Phase Duration:** 3-4 weeks  
**Dependencies:** Phase 1 Complete ✅

---

## EXECUTIVE SUMMARY

Phase 2 transforms AutoHealX from a backend API into a **complete infrastructure monitoring platform** by connecting real agents to real infrastructure. This phase establishes secure, authenticated agent communication with the backend, real telemetry collection, and the foundation for intelligent remediation.

**Critical Principle:** Phase 2 does NOT implement autonomous AI remediation. It establishes the **secure foundation** for future phases.

---

## REPOSITORY INSPECTION FINDINGS

### Phase 1 Status: ✅ COMPLETE

**Existing Backend Infrastructure:**
- PostgreSQL database with 9 tables
- Express API with 25 endpoints
- JWT authentication (8h access, 7d refresh)
- RBAC with 4 roles (OWNER, ADMIN, OPERATOR, VIEWER)
- Multi-tenant isolation (organization_id enforcement)
- Sequelize models: Organization, User, Role, Project, Service, Incident, IncidentEvent, AuditLog
- Complete security middleware stack
- Winston logging with rotation
- Docker orchestration

**Existing Agent (JavaScript):**
Located in `agent/` directory with following components:

```
agent/
├── index.js              # Main orchestrator (15s monitoring cycle)
├── monitor.js            # Windows-accurate system metrics collection
├── detector.js           # Rule-based detection (thresholds)
├── advancedDetector.js   # Trend analysis + confidence scoring
├── intelligentEngine.js  # Decision engine (NOT AI - deterministic)
├── healer.js             # Safe action execution (allowlisted)
├── permissionSystem.js   # File-based permission management
├── knowledgeBase.js      # Success rate tracking
├── firebase.js           # Firebase/localStorage sync
├── devicePairing.js      # Device registration (disabled)
└── bridgeSystem.js       # Communication bridge
```

**Current Agent Capabilities:**
- ✅ Collects real Windows metrics (CPU, memory, processes)
- ✅ Rule-based detection (75%/90% CPU, 88% memory thresholds)
- ✅ Trend analysis (memory leaks, sustained high CPU)
- ✅ Confidence scoring for detections
- ✅ Safe process killing with allowlist
- ✅ Permission system (suggestion/auto modes)
- ✅ Knowledge base for success tracking
- ✅ Firebase/localStorage for persistence

**Current Agent PROBLEMS (Must Fix):**
- ❌ **File-based communication** (`config/killRequest.json`)
- ❌ **No backend API integration**
- ❌ **No authentication** (anyone with file access can send commands)
- ❌ **No authorization** (cannot verify who approved actions)
- ❌ **No audit trail** to backend
- ❌ **localhost-only** (cannot work across network)
- ❌ **Firebase is client-side** (should be server-side)

**Existing Frontend:**
- React dashboard at `dashboard/`
- Device monitoring UI
- Real-time metrics display
- Process management interface

---

## PHASE 2 OBJECTIVES

### Primary Goal
**Connect real infrastructure agents to AutoHealX backend via authenticated, auditable API communication.**

### Specific Outcomes

1. **Agent Registration & Authentication**
   - Agents register via API
   - Receive agent-specific credentials (NOT user JWT)
   - Authenticate with backend using agent tokens
   - Support agent revocation

2. **Real Telemetry to Backend**
   - System metrics (CPU, memory, disk, network)
   - Service health (HTTP checks, process status)
   - All telemetry flows through backend API
   - Telemetry stored in PostgreSQL

3. **Secure Command Channel**
   - Backend sends commands to agents
   - Agents validate allowlisted commands
   - Command execution audited
   - No arbitrary shell execution

4. **Incident Integration**
   - Agent detections create incidents in backend
   - Evidence attached to incidents
   - Incident deduplication
   - Timeline tracking

5. **Remove File-Based Communication**
   - Delete `config/killRequest.json` polling
   - Delete `config/actionSignal.json` polling
   - All communication via API

---

## ARCHITECTURE DECISIONS

### Communication Protocol

**CHOSEN: REST API for Telemetry + WebSocket for Commands**

**Rationale:**
- REST API for agent → backend telemetry (unidirectional, bulk)
- WebSocket for backend → agent commands (bidirectional, real-time)
- Tried and tested pattern
- Handles network failures well
- No polling overhead

**Rejected Alternatives:**
- Pure REST polling (higher latency, more overhead)
- Pure WebSocket (unnecessary for telemetry bulk uploads)
- gRPC (over-engineering for MVP)

### Agent Authentication

**CHOSEN: Separate Agent Token System**

**NOT using user JWT for agents because:**
- Agents are machines, not humans
- Need different expiry rules
- Need different permissions
- Need machine-specific revocation

**Agent Auth Flow:**
```
1. Admin registers agent via dashboard (authenticated)
2. Backend generates agent API key (one-time display)
3. Agent stores API key locally (.agent_credentials file, 0600 permissions)
4. Agent exchanges API key for short-lived JWT (1h expiry)
5. Agent refreshes JWT automatically
6. Backend can revoke agent independently of users
```

### Telemetry Storage

**CHOSEN: PostgreSQL with Future Time-Series Migration Path**

**Phase 2:** Store recent telemetry in PostgreSQL
- Last 24 hours of metrics per agent
- Aggregated hourly summaries retained longer
- Incident evidence stored permanently

**Future:** Migrate high-frequency metrics to time-series DB (Phase 5+)
- Prometheus, InfluxDB, or TimescaleDB
- Keep PostgreSQL for incident/policy data
- No premature optimization

---

## DATABASE SCHEMA ADDITIONS

### New Tables for Phase 2

```sql
-- ==============================================
-- AGENTS
-- ==============================================
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  
  -- Identity
  name VARCHAR(255) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'linux', 'windows', 'darwin'
  architecture VARCHAR(50), -- 'x64', 'arm64'
  version VARCHAR(50), -- Agent version
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, online, offline, degraded, revoked
  last_heartbeat_at TIMESTAMP,
  
  -- Capabilities
  capabilities JSONB DEFAULT '[]'::jsonb, -- ['docker', 'process_management', 'metrics_collection']
  
  -- Registration
  registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Audit
  revoked_at TIMESTAMP,
  revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revoke_reason TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(organization_id, hostname)
);

CREATE INDEX idx_agents_organization_id ON agents(organization_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_last_heartbeat ON agents(last_heartbeat_at DESC);

-- ==============================================
-- AGENT CREDENTIALS (Hashed)
-- ==============================================
CREATE TABLE agent_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Hashed API key (bcrypt, same as passwords)
  api_key_hash TEXT NOT NULL,
  
  -- Expiry
  expires_at TIMESTAMP,
  
  -- Usage tracking
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  
  -- Revocation
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(agent_id)
);

-- ==============================================
-- AGENT HEARTBEATS (Rolling window)
-- ==============================================
CREATE TABLE agent_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Heartbeat data
  status VARCHAR(50) NOT NULL, -- online, degraded
  uptime_seconds BIGINT,
  
  -- System snapshot
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  disk_usage DECIMAL(5,2),
  
  -- Agent health
  collector_status JSONB, -- Status of each collector
  error_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_heartbeats_agent_id ON agent_heartbeats(agent_id, created_at DESC);
CREATE INDEX idx_heartbeats_created ON agent_heartbeats(created_at DESC);

-- Partition by time (for future optimization)
-- Retention: Keep last 7 days, delete older

-- ==============================================
-- TELEMETRY EVENTS
-- ==============================================
CREATE TABLE telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  
  -- Event classification
  event_type VARCHAR(100) NOT NULL, -- 'METRIC', 'HEALTH_CHECK', 'ERROR', 'LOG'
  source VARCHAR(255), -- Collector name
  
  -- Event data
  data JSONB NOT NULL,
  
  -- Timing
  event_timestamp TIMESTAMP NOT NULL, -- When event occurred
  received_at TIMESTAMP NOT NULL DEFAULT NOW(), -- When backend received it
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telemetry_org_time ON telemetry_events(organization_id, event_timestamp DESC);
CREATE INDEX idx_telemetry_agent_time ON telemetry_events(agent_id, event_timestamp DESC);
CREATE INDEX idx_telemetry_service ON telemetry_events(service_id, event_timestamp DESC) WHERE service_id IS NOT NULL;
CREATE INDEX idx_telemetry_event_type ON telemetry_events(event_type);

-- Retention: Keep last 24 hours full granularity, then aggregate

-- ==============================================
-- SERVICE HEALTH SNAPSHOTS
-- ==============================================
CREATE TABLE service_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Health status
  status VARCHAR(50) NOT NULL, -- healthy, degraded, unhealthy, unknown
  
  -- Metrics
  response_latency_ms INTEGER,
  error_rate DECIMAL(5,2),
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  
  -- HTTP Health Check
  http_status_code INTEGER,
  http_response_time_ms INTEGER,
  
  -- Process Health
  process_running BOOLEAN,
  process_pid INTEGER,
  
  -- Additional data
  metadata JSONB,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_health_service ON service_health_snapshots(service_id, created_at DESC);
CREATE INDEX idx_service_health_status ON service_health_snapshots(status);

-- ==============================================
-- COMMANDS (Backend → Agent)
-- ==============================================
CREATE TABLE commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  
  -- Command details
  command_type VARCHAR(100) NOT NULL, -- 'RESTART_SERVICE', 'KILL_PROCESS', 'COLLECT_DIAGNOSTICS'
  parameters JSONB,
  
  -- Lifecycle
  status VARCHAR(50) NOT NULL DEFAULT 'created', 
  -- created, authorized, dispatched, received, executing, completed, failed, timeout, cancelled
  
  -- Authorization
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approval_required BOOLEAN DEFAULT true,
  approved_at TIMESTAMP,
  
  -- Execution
  dispatched_at TIMESTAMP,
  received_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Expiry
  expires_at TIMESTAMP NOT NULL,
  
  -- Results
  success BOOLEAN,
  result JSONB,
  error TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commands_agent ON commands(agent_id, status);
CREATE INDEX idx_commands_org ON commands(organization_id, created_at DESC);
CREATE INDEX idx_commands_status ON commands(status);
CREATE INDEX idx_commands_expires ON commands(expires_at) WHERE status IN ('created', 'authorized', 'dispatched');

-- ==============================================
-- COMMAND EVENTS (Audit Trail)
-- ==============================================
CREATE TABLE command_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id UUID NOT NULL REFERENCES commands(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL, -- 'created', 'authorized', 'dispatched', 'received', 'completed', etc.
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_type VARCHAR(50), -- 'user', 'agent', 'system'
  
  -- Event data
  description TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_command_events_command ON command_events(command_id, created_at);

-- ==============================================
-- DETECTION RESULTS (From Agents)
-- ==============================================
CREATE TABLE detection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  
  -- Detection details
  detection_type VARCHAR(100) NOT NULL, -- 'HIGH_CPU', 'MEMORY_OVERLOAD', etc.
  severity VARCHAR(50) NOT NULL, -- critical, warning, info
  
  -- Metrics
  current_value DECIMAL(10,2),
  threshold DECIMAL(10,2),
  confidence DECIMAL(5,2),
  
  -- Context
  cause TEXT,
  process_name VARCHAR(255),
  process_pid INTEGER,
  
  -- Resolution
  suggested_action VARCHAR(255),
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  
  -- Deduplication
  fingerprint VARCHAR(255), -- Hash of type+service+process for dedup
  
  detected_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_detection_org ON detection_results(organization_id, detected_at DESC);
CREATE INDEX idx_detection_agent ON detection_results(agent_id, detected_at DESC);
CREATE INDEX idx_detection_service ON detection_results(service_id, detected_at DESC) WHERE service_id IS NOT NULL;
CREATE INDEX idx_detection_fingerprint ON detection_results(fingerprint, detected_at DESC);

-- ==============================================
-- POLICIES (Command Authorization)
-- ==============================================
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Policy details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  
  -- Matching criteria
  environment VARCHAR(50), -- 'production', 'staging', 'development', null=all
  service_id UUID REFERENCES services(id) ON DELETE CASCADE, -- null=all services
  command_type VARCHAR(100), -- null=all commands
  
  -- Authorization
  requires_approval BOOLEAN DEFAULT true,
  allowed_roles JSONB DEFAULT '[]'::jsonb, -- ['OWNER', 'ADMIN', 'OPERATOR']
  
  -- Risk
  risk_level VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
  
  -- Execution limits
  max_executions_per_hour INTEGER,
  timeout_seconds INTEGER DEFAULT 300,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policies_org ON policies(organization_id);
CREATE INDEX idx_policies_enabled ON policies(enabled) WHERE enabled = true;
```

### Migration Script

Create: `backend/database/migrations/002_phase2_agent_integration.sql`

---

## IMPLEMENTATION PHASES

### Week 1: Agent Registration & Authentication

#### Task 1.1: Backend - Agent Models

**File:** `backend/src/models/Agent.ts`

```typescript
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AgentAttributes {
  id: string;
  organization_id: string;
  project_id: string | null;
  service_id: string | null;
  name: string;
  hostname: string;
  platform: string;
  architecture: string | null;
  version: string | null;
  status: 'pending' | 'online' | 'offline' | 'degraded' | 'revoked';
  last_heartbeat_at: Date | null;
  capabilities: string[];
  registered_by: string | null;
  registered_at: Date;
  revoked_at: Date | null;
  revoked_by: string | null;
  revoke_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

interface AgentCreationAttributes extends Optional<AgentAttributes, 'id' | 'project_id' | 'service_id' | 'architecture' | 'version' | 'status' | 'last_heartbeat_at' | 'capabilities' | 'registered_by' | 'revoked_at' | 'revoked_by' | 'revoke_reason' | 'created_at' | 'updated_at'> {}

class Agent extends Model<AgentAttributes, AgentCreationAttributes> implements AgentAttributes {
  declare id: string;
  declare organization_id: string;
  declare project_id: string | null;
  declare service_id: string | null;
  declare name: string;
  declare hostname: string;
  declare platform: string;
  declare architecture: string | null;
  declare version: string | null;
  declare status: 'pending' | 'online' | 'offline' | 'degraded' | 'revoked';
  declare last_heartbeat_at: Date | null;
  declare capabilities: string[];
  declare registered_by: string | null;
  declare registered_at: Date;
  declare revoked_at: Date | null;
  declare revoked_by: string | null;
  declare revoke_reason: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Agent.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organization_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  service_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'services',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  hostname: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  platform: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  architecture: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  version: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'online', 'offline', 'degraded', 'revoked'),
    defaultValue: 'pending',
    allowNull: false
  },
  last_heartbeat_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  capabilities: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false
  },
  registered_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  registered_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  revoked_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  revoke_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  tableName: 'agents',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['status'] },
    { fields: ['last_heartbeat_at'] },
    { unique: true, fields: ['organization_id', 'hostname'] }
  ]
});

export default Agent;
```

Create similar models for:
- `AgentCredential.ts`
- `AgentHeartbeat.ts`
- `TelemetryEvent.ts`
- `ServiceHealthSnapshot.ts`
- `Command.ts`
- `CommandEvent.ts`
- `DetectionResult.ts`
- `Policy.ts`

#### Task 1.2: Backend - Agent Registration Service

**File:** `backend/src/services/agentService.ts`

```typescript
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Agent, AgentCredential } from '../models';
import { serverConfig } from '../config/server';
import { AppError } from '../errors/AppError';
import logger from '../logging/logger';

export interface AgentRegistrationData {
  organizationId: string;
  projectId?: string;
  serviceId?: string;
  name: string;
  hostname: string;
  platform: string;
  architecture?: string;
  version?: string;
  capabilities?: string[];
  registeredBy: string;
}

export class AgentService {
  /**
   * Register a new agent
   * Returns API key only once - must be stored by caller
   */
  static async registerAgent(data: AgentRegistrationData): Promise<{ agent: Agent; apiKey: string }> {
    try {
      // Check for duplicate hostname in organization
      const existing = await Agent.findOne({
        where: {
          organization_id: data.organizationId,
          hostname: data.hostname
        }
      });

      if (existing) {
        throw new AppError('Agent with this hostname already registered in organization', 409);
      }

      // Create agent
      const agent = await Agent.create({
        organization_id: data.organizationId,
        project_id: data.projectId,
        service_id: data.serviceId,
        name: data.name,
        hostname: data.hostname,
        platform: data.platform,
        architecture: data.architecture,
        version: data.version,
        capabilities: data.capabilities || [],
        registered_by: data.registeredBy,
        status: 'pending'
      });

      // Generate secure API key (32 bytes = 64 hex chars)
      const apiKey = `ahx_${crypto.randomBytes(32).toString('hex')}`;

      // Hash API key with bcrypt (same as passwords)
      const apiKeyHash = await bcrypt.hash(apiKey, serverConfig.security.bcryptRounds);

      // Store hashed credential
      await AgentCredential.create({
        agent_id: agent.id,
        api_key_hash: apiKeyHash,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      });

      logger.info(`Agent registered: ${agent.name} (${agent.hostname}) for org ${data.organizationId}`);

      // Return plaintext API key only once
      return { agent, apiKey };
    } catch (error) {
      logger.error('Agent registration error:', error);
      throw error;
    }
  }

  /**
   * Authenticate agent with API key and return short-lived JWT
   */
  static async authenticateAgent(apiKey: string): Promise<string> {
    try {
      if (!apiKey.startsWith('ahx_')) {
        throw new AppError('Invalid API key format', 401);
      }

      // Find all agent credentials (we need to check all because hash is not searchable)
      const credentials = await AgentCredential.findAll({
        where: { revoked: false },
        include: [{
          model: Agent,
          as: 'agent',
          where: { status: { $ne: 'revoked' } }
        }]
      });

      // Try to match API key
      let matchedCredential = null;
      for (const cred of credentials) {
        const isValid = await bcrypt.compare(apiKey, cred.api_key_hash);
        if (isValid) {
          matchedCredential = cred;
          break;
        }
      }

      if (!matchedCredential) {
        throw new AppError('Invalid API key', 401);
      }

      // Check expiry
      if (matchedCredential.expires_at && matchedCredential.expires_at < new Date()) {
        throw new AppError('API key expired', 401);
      }

      // Update usage
      await matchedCredential.update({
        last_used_at: new Date(),
        usage_count: matchedCredential.usage_count + 1
      });

      // Generate short-lived JWT for agent
      const agent = matchedCredential.agent;
      const token = jwt.sign(
        {
          agentId: agent.id,
          organizationId: agent.organization_id,
          hostname: agent.hostname,
          type: 'agent'
        },
        serverConfig.jwt.secret,
        { expiresIn: '1h' } // Agents get 1 hour tokens
      );

      logger.info(`Agent authenticated: ${agent.hostname}`);

      return token;
    } catch (error) {
      logger.error('Agent authentication error:', error);
      throw error;
    }
  }

  /**
   * Revoke agent access
   */
  static async revokeAgent(agentId: string, revokedBy: string, reason: string): Promise<void> {
    const agent = await Agent.findByPk(agentId);
    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    await agent.update({
      status: 'revoked',
      revoked_at: new Date(),
      revoked_by: revokedBy,
      revoke_reason: reason
    });

    // Revoke credential
    await AgentCredential.update(
      { revoked: true, revoked_at: new Date() },
      { where: { agent_id: agentId } }
    );

    logger.warn(`Agent revoked: ${agent.hostname} by ${revokedBy}. Reason: ${reason}`);
  }
}
```

#### Task 1.3: Backend - Agent API Routes

**File:** `backend/src/routes/agents.ts`

```typescript
import { Router } from 'express';
import { AgentController } from '../controllers/agentController';
import { authenticate } from '../middleware/authenticate';
import { authenticateAgent } from '../middleware/authenticateAgent'; // New!
import { authorize } from '../middleware/authorize';
import { enforceTenantIsolation, injectOrganizationId } from '../middleware/tenantIsolation';
import { validateRequest } from '../middleware/validateRequest';
import { agentRegistrationValidation, agentAuthValidation } from '../validators/agentValidators';

const router = Router();

// ==============================================
// ADMIN ROUTES (User Authentication)
// ==============================================

// POST /api/v1/agents/register - Register new agent (admin only)
router.post(
  '/register',
  authenticate,
  authorize('manage_services'),
  injectOrganizationId,
  enforceTenantIsolation,
  validateRequest(agentRegistrationValidation),
  AgentController.register
);

// GET /api/v1/agents - List agents
router.get(
  '/',
  authenticate,
  authorize('view_services'),
  injectOrganizationId,
  AgentController.list
);

// GET /api/v1/agents/:id - Get agent details
router.get(
  '/:id',
  authenticate,
  authorize('view_services'),
  AgentController.getById
);

// POST /api/v1/agents/:id/revoke - Revoke agent
router.post(
  '/:id/revoke',
  authenticate,
  authorize('manage_services'),
  AgentController.revoke
);

// ==============================================
// AGENT AUTHENTICATION (No User Auth)
// ==============================================

// POST /api/v1/agents/auth - Get JWT from API key
router.post(
  '/auth',
  validateRequest(agentAuthValidation),
  AgentController.authenticate
);

// ==============================================
// AGENT ROUTES (Agent Authentication)
// ==============================================

// POST /api/v1/agents/heartbeat - Agent heartbeat
router.post(
  '/heartbeat',
  authenticateAgent, // New middleware for agent JWT
  AgentController.heartbeat
);

export default router;
```

#### Task 1.4: Agent - Remove File System, Add API Registration

**File:** `agent/src/config.ts` (NEW)

```typescript
import * as fs from 'fs';
import * as path from 'path';

export interface AgentConfig {
  backendUrl: string;
  apiKey?: string;
  agentId?: string;
  organizationId?: string;
}

const CONFIG_PATH = path.join(__dirname, '../.agent_credentials');

export function loadConfig(): AgentConfig {
  const config: AgentConfig = {
    backendUrl: process.env.BACKEND_URL || 'http://localhost:4000'
  };

  // Try to load stored credentials
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const stored = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      config.apiKey = stored.apiKey;
      config.agentId = stored.agentId;
      config.organizationId = stored.organizationId;
    } catch (error) {
      console.warn('Failed to load agent credentials:', error.message);
    }
  }

  return config;
}

export function saveConfig(config: AgentConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
  console.log('✅ Agent credentials saved securely');
}

export function isConfigured(): boolean {
  const config = loadConfig();
  return !!config.apiKey;
}
```

**File:** `agent/src/registration.ts` (NEW)

```typescript
import axios from 'axios';
import os from 'os';
import { loadConfig, saveConfig } from './config';

export async function registerAgent(enrollmentToken: string): Promise<void> {
  const config = loadConfig();

  console.log('🔐 Registering agent with AutoHealX backend...');

  try {
    const response = await axios.post(
      `${config.backendUrl}/api/v1/agents/register`,
      {
        name: os.hostname(),
        hostname: os.hostname(),
        platform: process.platform,
        architecture: os.arch(),
        version: require('../package.json').version,
        capabilities: ['system_metrics', 'process_management', 'health_checks']
      },
      {
        headers: {
          'Authorization': `Bearer ${enrollmentToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { agent, apiKey } = response.data.data;

    // Save credentials
    saveConfig({
      ...config,
      apiKey,
      agentId: agent.id,
      organizationId: agent.organization_id
    });

    console.log('✅ Agent registered successfully!');
    console.log(`   Agent ID: ${agent.id}`);
    console.log(`   Hostname: ${agent.hostname}`);
    console.log('   API key stored securely');
    console.log('\n⚠️  IMPORTANT: Save your API key securely. It cannot be retrieved again.');

  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
    throw error;
  }
}
```

**File:** `agent/src/authentication.ts` (NEW)

```typescript
import axios from 'axios';
import { loadConfig } from './config';

let currentToken: string | null = null;
let tokenExpiry: number = 0;

export async function getValidToken(): Promise<string> {
  // Return cached token if still valid
  if (currentToken && Date.now() < tokenExpiry - 5 * 60 * 1000) { // Refresh 5min before expiry
    return currentToken;
  }

  // Get new token
  const config = loadConfig();

  if (!config.apiKey) {
    throw new Error('Agent not registered. Run with --register flag');
  }

  try {
    const response = await axios.post(
      `${config.backendUrl}/api/v1/agents/auth`,
      { apiKey: config.apiKey },
      { headers: { 'Content-Type': 'application/json' } }
    );

    currentToken = response.data.data.token;
    tokenExpiry = Date.now() + 50 * 60 * 1000; // 50 minutes (expires in 1h)

    console.log('🔐 Agent authenticated successfully');

    return currentToken;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    throw new Error('Agent authentication failed. API key may be revoked.');
  }
}
```

---

### Week 2: Telemetry Ingestion & Heartbeat

#### Task 2.1: Backend - Telemetry API

**File:** `backend/src/routes/telemetry.ts`

```typescript
import { Router } from 'express';
import { TelemetryController } from '../controllers/telemetryController';
import { authenticateAgent } from '../middleware/authenticateAgent';
import { validateRequest } from '../middleware/validateRequest';
import { telemetryValidation, heartbeatValidation } from '../validators/telemetryValidators';

const router = Router();

// All routes require agent authentication
router.use(authenticateAgent);

// POST /api/v1/telemetry/metrics - Bulk metrics upload
router.post(
  '/metrics',
  validateRequest(telemetryValidation),
  TelemetryController.ingestMetrics
);

// POST /api/v1/telemetry/health - Service health check results
router.post(
  '/health',
  validateRequest(telemetryValidation),
  TelemetryController.ingestHealthCheck
);

// POST /api/v1/telemetry/detection - Detection results from agent
router.post(
  '/detection',
  validateRequest(telemetryValidation),
  TelemetryController.ingestDetection
);

export default router;
```

#### Task 2.2: Agent - Replace Firebase with API

**File:** `agent/src/telemetry.ts` (NEW)

```typescript
import axios from 'axios';
import { getValidToken } from './authentication';
import { loadConfig } from './config';

export async function sendMetrics(metrics: any): Promise<void> {
  const config = loadConfig();
  const token = await getValidToken();

  try {
    await axios.post(
      `${config.backendUrl}/api/v1/telemetry/metrics`,
      {
        event_type: 'METRIC',
        data: {
          cpu: metrics.cpu.usage,
          memory: metrics.memory.usedPercent,
          disk: metrics.disks,
          network: metrics.network,
          processes: {
            total: metrics.processes.total,
            topCPU: metrics.processes.topCPU.slice(0, 20)
          }
        },
        event_timestamp: new Date(metrics.timestamp).toISOString()
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
  } catch (error) {
    console.error('Failed to send metrics:', error.message);
    // Don't throw - allow agent to continue
  }
}

export async function sendHeartbeat(status: string, metrics: any): Promise<void> {
  const config = loadConfig();
  const token = await getValidToken();

  try {
    await axios.post(
      `${config.backendUrl}/api/v1/agents/heartbeat`,
      {
        status,
        uptime_seconds: Math.floor(process.uptime()),
        cpu_usage: metrics.cpu.usage,
        memory_usage: metrics.memory.usedPercent,
        collector_status: { monitor: 'online', detector: 'online' }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 3000
      }
    );
  } catch (error) {
    console.error('Failed to send heartbeat:', error.message);
  }
}

export async function sendDetection(detection: any): Promise<void> {
  const config = loadConfig();
  const token = await getValidToken();

  try {
    const response = await axios.post(
      `${config.backendUrl}/api/v1/telemetry/detection`,
      {
        detection_type: detection.type,
        severity: detection.severity,
        current_value: detection.currentValue,
        threshold: detection.threshold,
        confidence: detection.confidence,
        cause: detection.cause,
        process_name: detection.process,
        suggested_action: detection.suggestedAction,
        detected_at: new Date().toISOString()
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    // Backend returns incident_id if created
    if (response.data.data.incident_id) {
      console.log(`📋 Incident created: ${response.data.data.incident_number}`);
    }
  } catch (error) {
    console.error('Failed to send detection:', error.message);
  }
}
```

---

### Week 3: Command Channel & Incident Integration

#### Task 3.1: Backend - WebSocket for Commands

**File:** `backend/src/websocket/agentSocket.ts`

```typescript
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { serverConfig } from '../config/server';
import { Agent, Command, CommandEvent } from '../models';
import logger from '../logging/logger';

interface AgentSocket extends Socket {
  agentId: string;
  organizationId: string;
}

export function setupAgentSocket(io: Server) {
  const agentNamespace = io.of('/agents');

  // Authentication middleware
  agentNamespace.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, serverConfig.jwt.secret) as any;
      
      if (decoded.type !== 'agent') {
        return next(new Error('Invalid token type'));
      }

      // Attach agent info to socket
      (socket as AgentSocket).agentId = decoded.agentId;
      (socket as AgentSocket).organizationId = decoded.organizationId;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  agentNamespace.on('connection', async (socket: Socket) => {
    const agentSocket = socket as AgentSocket;
    const agentId = agentSocket.agentId;

    logger.info(`Agent connected: ${agentId}`);

    // Join agent-specific room
    socket.join(`agent:${agentId}`);
    socket.join(`org:${agentSocket.organizationId}`);

    // Update agent status
    await Agent.update(
      { status: 'online', last_heartbeat_at: new Date() },
      { where: { id: agentId } }
    );

    // Send pending commands
    const pendingCommands = await Command.findAll({
      where: {
        agent_id: agentId,
        status: 'authorized'
      }
    });

    for (const cmd of pendingCommands) {
      socket.emit('command', {
        command_id: cmd.id,
        command_type: cmd.command_type,
        parameters: cmd.parameters,
        expires_at: cmd.expires_at
      });

      await cmd.update({ status: 'dispatched', dispatched_at: new Date() });
      await CommandEvent.create({
        command_id: cmd.id,
        event_type: 'dispatched',
        actor_type: 'system',
        description: 'Command dispatched to agent'
      });
    }

    // Handle command acknowledgment
    socket.on('command_received', async (data: { command_id: string }) => {
      await Command.update(
        { status: 'received', received_at: new Date() },
        { where: { id: data.command_id } }
      );

      await CommandEvent.create({
        command_id: data.command_id,
        event_type: 'received',
        actor_type: 'agent',
        description: 'Command received by agent'
      });
    });

    // Handle command execution start
    socket.on('command_executing', async (data: { command_id: string }) => {
      await Command.update(
        { status: 'executing', started_at: new Date() },
        { where: { id: data.command_id } }
      );

      await CommandEvent.create({
        command_id: data.command_id,
        event_type: 'executing',
        actor_type: 'agent',
        description: 'Command execution started'
      });
    });

    // Handle command result
    socket.on('command_result', async (data: {
      command_id: string;
      success: boolean;
      result?: any;
      error?: string;
    }) => {
      await Command.update({
        status: data.success ? 'completed' : 'failed',
        completed_at: new Date(),
        success: data.success,
        result: data.result,
        error: data.error
      }, { where: { id: data.command_id } });

      await CommandEvent.create({
        command_id: data.command_id,
        event_type: data.success ? 'completed' : 'failed',
        actor_type: 'agent',
        description: data.success ? 'Command completed successfully' : 'Command execution failed',
        metadata: data
      });

      logger.info(`Command ${data.command_id}: ${data.success ? 'SUCCESS' : 'FAILED'}`);
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      await Agent.update(
        { status: 'offline' },
        { where: { id: agentId } }
      );

      logger.info(`Agent disconnected: ${agentId}`);
    });
  });
}

/**
 * Send command to specific agent
 */
export async function sendCommandToAgent(
  io: Server,
  agentId: string,
  command: Command
): Promise<void> {
  io.of('/agents').to(`agent:${agentId}`).emit('command', {
    command_id: command.id,
    command_type: command.command_type,
    parameters: command.parameters,
    expires_at: command.expires_at
  });

  await command.update({ status: 'dispatched', dispatched_at: new Date() });

  await CommandEvent.create({
    command_id: command.id,
    event_type: 'dispatched',
    actor_type: 'system',
    description: 'Command dispatched to agent'
  });
}
```

#### Task 3.2: Agent - WebSocket Client

**File:** `agent/src/commandChannel.ts` (NEW)

```typescript
import { io, Socket } from 'socket.io-client';
import { getValidToken } from './authentication';
import { loadConfig } from './config';
import { executeHeal } from './healer';
import logger from './logger';

let socket: Socket | null = null;

const ALLOWED_COMMANDS = [
  'KILL_TOP_CPU_PROCESS',
  'KILL_TOP_MEMORY_PROCESS',
  'KILL_SPECIFIC_PROCESS',
  'RESTART_SERVICE',
  'COLLECT_DIAGNOSTICS'
];

export async function connectCommandChannel(): Promise<void> {
  const config = loadConfig();
  const token = await getValidToken();

  const wsUrl = config.backendUrl.replace('http', 'ws');

  socket = io(`${wsUrl}/agents`, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000
  });

  socket.on('connect', () => {
    console.log('✅ Command channel connected');
  });

  socket.on('disconnect', () => {
    console.log('⚠️  Command channel disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Command channel error:', error.message);
  });

  socket.on('command', async (command: any) => {
    console.log(`📨 Received command: ${command.command_type}`);

    // Send acknowledgment
    socket?.emit('command_received', { command_id: command.command_id });

    // Validate command
    if (!ALLOWED_COMMANDS.includes(command.command_type)) {
      socket?.emit('command_result', {
        command_id: command.command_id,
        success: false,
        error: `Command type '${command.command_type}' not in allowlist`
      });
      return;
    }

    // Check expiry
    if (new Date(command.expires_at) < new Date()) {
      socket?.emit('command_result', {
        command_id: command.command_id,
        success: false,
        error: 'Command expired'
      });
      return;
    }

    // Execute command
    try {
      socket?.emit('command_executing', { command_id: command.command_id });

      const result = await executeHeal(command.command_type, 'auto', command.parameters);

      socket?.emit('command_result', {
        command_id: command.command_id,
        success: result.success,
        result: {
          message: result.message,
          processName: result.processName,
          pid: result.pid
        }
      });

      console.log(`✅ Command executed: ${result.message}`);
    } catch (error) {
      socket?.emit('command_result', {
        command_id: command.command_id,
        success: false,
        error: error.message
      });

      console.error(`❌ Command execution failed: ${error.message}`);
    }
  });
}

export function disconnectCommandChannel(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

#### Task 3.3: Backend - Detection to Incident Pipeline

**File:** `backend/src/services/detectionService.ts`

```typescript
import { DetectionResult, Incident, IncidentEvent, IncidentEvidence, Service } from '../models';
import { Op } from 'sequelize';
import logger from '../logging/logger';

const SEVERITY_MAP: Record<string, string> = {
  critical: 'critical',
  warning: 'medium',
  info: 'low'
};

export class DetectionService {
  /**
   * Process detection from agent and create/update incident
   */
  static async processDetection(detection: any, agentId: string, organizationId: string): Promise<any> {
    try {
      // Create detection record
      const fingerprint = this.generateFingerprint(detection);
      
      const detectionRecord = await DetectionResult.create({
        organization_id: organizationId,
        agent_id: agentId,
        service_id: detection.service_id,
        detection_type: detection.detection_type,
        severity: detection.severity,
        current_value: detection.current_value,
        threshold: detection.threshold,
        confidence: detection.confidence,
        cause: detection.cause,
        process_name: detection.process_name,
        process_pid: detection.process_pid,
        suggested_action: detection.suggested_action,
        fingerprint,
        detected_at: new Date(detection.detected_at)
      });

      // Check for existing incident (deduplication)
      const existingIncident = await this.findRecentIncident(organizationId, fingerprint);

      if (existingIncident) {
        // Add evidence to existing incident
        await IncidentEvidence.create({
          incident_id: existingIncident.id,
          evidence_type: 'DETECTION',
          source_id: detectionRecord.id,
          observation: detection.cause,
          timestamp: detectionRecord.detected_at
        });

        await IncidentEvent.create({
          incident_id: existingIncident.id,
          event_type: 'DETECTION_RECURRING',
          description: `Detection recurred: ${detection.detection_type}`,
          metadata: detection
        });

        logger.info(`Detection added to existing incident: ${existingIncident.incident_number}`);

        return {
          incident_id: existingIncident.id,
          incident_number: existingIncident.incident_number,
          is_new: false
        };
      }

      // Create new incident
      const incident = await this.createIncidentFromDetection(detection, detectionRecord, organizationId);

      logger.info(`New incident created: ${incident.incident_number}`);

      return {
        incident_id: incident.id,
        incident_number: incident.incident_number,
        is_new: true
      };
    } catch (error) {
      logger.error('Detection processing error:', error);
      throw error;
    }
  }

  /**
   * Generate fingerprint for deduplication
   */
  private static generateFingerprint(detection: any): string {
    const parts = [
      detection.detection_type,
      detection.service_id || 'no-service',
      detection.process_name || 'no-process'
    ];
    return parts.join('|');
  }

  /**
   * Find recent incident with same fingerprint (last 5 minutes)
   */
  private static async findRecentIncident(organizationId: string, fingerprint: string): Promise<Incident | null> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const recentDetection = await DetectionResult.findOne({
      where: {
        organization_id: organizationId,
        fingerprint,
        detected_at: { [Op.gte]: fiveMinutesAgo },
        incident_id: { [Op.ne]: null }
      },
      order: [['detected_at', 'DESC']],
      include: [{
        model: Incident,
        as: 'incident',
        where: {
          status: {
            [Op.in]: ['detected', 'triaging', 'investigating', 'identified', 'action_pending']
          }
        }
      }]
    });

    return recentDetection?.incident || null;
  }

  /**
   * Create new incident from detection
   */
  private static async createIncidentFromDetection(
    detection: any,
    detectionRecord: DetectionResult,
    organizationId: string
  ): Promise<Incident> {
    // Generate incident number
    const incidentNumber = await this.generateIncidentNumber();

    // Determine service
    let service = null;
    if (detection.service_id) {
      service = await Service.findByPk(detection.service_id);
    }

    const incident = await Incident.create({
      organization_id: organizationId,
      project_id: service?.project_id,
      service_id: detection.service_id,
      incident_number: incidentNumber,
      title: `${detection.detection_type}: ${detection.cause}`,
      description: `Detected by agent: ${detection.cause}\nSuggested action: ${detection.suggested_action}`,
      severity: SEVERITY_MAP[detection.severity] || 'medium',
      status: 'detected',
      detected_at: detectionRecord.detected_at,
      confidence: detection.confidence / 100 // Convert percentage to decimal
    });

    // Link detection to incident
    await detectionRecord.update({ incident_id: incident.id });

    // Create incident event
    await IncidentEvent.create({
      incident_id: incident.id,
      event_type: 'INCIDENT_CREATED',
      description: 'Incident detected by agent',
      metadata: detection
    });

    // Create evidence
    await IncidentEvidence.create({
      incident_id: incident.id,
      evidence_type: 'DETECTION',
      source_id: detectionRecord.id,
      observation: detection.cause,
      timestamp: detectionRecord.detected_at
    });

    return incident;
  }

  /**
   * Generate incident number (INC-YYYYMMDD-XXXX)
   */
  private static async generateIncidentNumber(): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    // Count incidents today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const count = await Incident.count({
      where: {
        detected_at: { [Op.gte]: todayStart }
      }
    });

    const sequence = String(count + 1).padStart(4, '0');
    
    return `INC-${today}-${sequence}`;
  }
}
```

---

### Week 4: Testing, Documentation, and Migration

#### Task 4.1: Integration Tests

**File:** `backend/tests/integration/agent.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/app';
import { Agent, AgentCredential } from '../../src/models';

describe('Agent Integration', () => {
  let adminToken: string;
  let agent: Agent;
  let apiKey: string;

  beforeAll(async () => {
    // Setup test org and admin user
    // ... (test setup code)
  });

  describe('Agent Registration', () => {
    it('should register agent with admin token', async () => {
      const response = await request(app)
        .post('/api/v1/agents/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'test-agent',
          hostname: 'test-host',
          platform: 'linux',
          capabilities: ['system_metrics']
        });

      expect(response.status).toBe(201);
      expect(response.body.data.agent).toBeDefined();
      expect(response.body.data.apiKey).toBeDefined();
      expect(response.body.data.apiKey).toMatch(/^ahx_/);

      agent = response.body.data.agent;
      apiKey = response.body.data.apiKey;
    });

    it('should reject duplicate hostname', async () => {
      const response = await request(app)
        .post('/api/v1/agents/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'test-agent-2',
          hostname: 'test-host', // Same hostname
          platform: 'linux'
        });

      expect(response.status).toBe(409);
    });
  });

  describe('Agent Authentication', () => {
    it('should authenticate with API key', async () => {
      const response = await request(app)
        .post('/api/v1/agents/auth')
        .send({ apiKey });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject invalid API key', async () => {
      const response = await request(app)
        .post('/api/v1/agents/auth')
        .send({ apiKey: 'ahx_invalid' });

      expect(response.status).toBe(401);
    });
  });

  describe('Telemetry Ingestion', () => {
    let agentToken: string;

    beforeAll(async () => {
      const authResponse = await request(app)
        .post('/api/v1/agents/auth')
        .send({ apiKey });
      agentToken = authResponse.body.data.token;
    });

    it('should accept metrics from authenticated agent', async () => {
      const response = await request(app)
        .post('/api/v1/telemetry/metrics')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          event_type: 'METRIC',
          data: {
            cpu: 45.2,
            memory: 60.5
          },
          event_timestamp: new Date().toISOString()
        });

      expect(response.status).toBe(201);
    });

    it('should reject metrics without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/telemetry/metrics')
        .send({
          event_type: 'METRIC',
          data: { cpu: 45.2 }
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Tenant Isolation', () => {
    let otherOrgAdminToken: string;

    beforeAll(async () => {
      // Create second organization
      // ... (setup code)
    });

    it('should not list agents from other organizations', async () => {
      const response = await request(app)
        .get('/api/v1/agents')
        .set('Authorization', `Bearer ${otherOrgAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.agents).toHaveLength(0);
    });
  });

  describe('Agent Revocation', () => {
    it('should revoke agent', async () => {
      const response = await request(app)
        .post(`/api/v1/agents/${agent.id}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Test revocation'
        });

      expect(response.status).toBe(200);
    });

    it('should reject authentication after revocation', async () => {
      const response = await request(app)
        .post('/api/v1/agents/auth')
        .send({ apiKey });

      expect(response.status).toBe(401);
    });
  });
});
```

#### Task 4.2: Agent Migration Script

**File:** `agent/migrate.sh`

```bash
#!/bin/bash

# AutoHealX Agent Migration Script
# Migrates from file-based to API-based communication

echo "AutoHealX Agent Migration to Phase 2"
echo "====================================="
echo ""

# Check if backend is running
echo "Checking backend connectivity..."
BACKEND_URL=${BACKEND_URL:-http://localhost:4000}
if ! curl -s "$BACKEND_URL/health" > /dev/null; then
  echo "❌ Backend not reachable at $BACKEND_URL"
  echo "   Please start the backend first"
  exit 1
fi
echo "✅ Backend is reachable"
echo ""

# Check for existing agent credentials
if [ -f ".agent_credentials" ]; then
  echo "⚠️  Existing agent credentials found"
  read -p "Do you want to re-register? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Keeping existing credentials"
    exit 0
  fi
fi

# Get enrollment token from user
echo "To register this agent, you need an enrollment token."
echo "1. Log into AutoHealX dashboard: http://localhost:3000"
echo "2. Navigate to Settings → Agents"
echo "3. Click 'Register New Agent'"
echo "4. Copy the enrollment token"
echo ""
read -p "Paste your enrollment token: " ENROLLMENT_TOKEN

if [ -z "$ENROLLMENT_TOKEN" ]; then
  echo "❌ No token provided"
  exit 1
fi

# Register agent
echo ""
echo "Registering agent..."
node -e "
const axios = require('axios');
const fs = require('fs');
const os = require('os');

(async () => {
  try {
    const response = await axios.post(
      '$BACKEND_URL/api/v1/agents/register',
      {
        name: os.hostname(),
        hostname: os.hostname(),
        platform: process.platform,
        architecture: os.arch(),
        version: require('./package.json').version,
        capabilities: ['system_metrics', 'process_management', 'health_checks']
      },
      {
        headers: {
          'Authorization': 'Bearer $ENROLLMENT_TOKEN',
          'Content-Type': 'application/json'
        }
      }
    );

    const { agent, apiKey } = response.data.data;

    // Save credentials
    fs.writeFileSync('.agent_credentials', JSON.stringify({
      backendUrl: '$BACKEND_URL',
      apiKey,
      agentId: agent.id,
      organizationId: agent.organization_id
    }, null, 2), { mode: 0o600 });

    console.log('✅ Agent registered successfully!');
    console.log('   Agent ID:', agent.id);
    console.log('   API key stored securely in .agent_credentials');
    console.log('');
    console.log('⚠️  IMPORTANT: Back up your .agent_credentials file securely');
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data?.error?.message || error.message);
    process.exit(1);
  }
})();
"

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Start the agent: npm start"
echo "2. The agent will now communicate via API"
echo "3. Old file-based communication is disabled"
```

#### Task 4.3: Phase 2 Documentation

Create comprehensive documentation:
- `docs/PHASE_2_COMPLETE.md`
- `docs/PHASE_2_ARCHITECTURE.md`
- `docs/PHASE_2_SECURITY.md`
- `docs/PHASE_2_API.md`
- `docs/PHASE_2_AGENT_PROTOCOL.md`

---

## PHASE 2 COMPLETION CRITERIA

### Must Have (Critical)

- [ ] Agent registration API works
- [ ] Agent authentication with API key → JWT works
- [ ] Agent can be revoked
- [ ] Agent heartbeat updates status (online/offline)
- [ ] Real system metrics reach backend via API
- [ ] Service health checks reach backend
- [ ] Telemetry is tenant-isolated (organization_id enforced)
- [ ] Detection results create incidents
- [ ] Incident deduplication works (5-minute window)
- [ ] Incident evidence attached
- [ ] Command model exists in database
- [ ] Commands can be created via API
- [ ] WebSocket command channel works
- [ ] Agent validates allowlisted commands
- [ ] Agent rejects arbitrary commands
- [ ] Command execution audited (command_events table)
- [ ] File-based communication removed
- [ ] Network failure handling (retry/backoff)
- [ ] Security tests pass
- [ ] Integration tests pass
- [ ] Existing Phase 1 APIs still work
- [ ] Existing frontend still works
- [ ] No secrets committed
- [ ] No fake AI claims
- [ ] Documentation complete

### Should Have (Important)

- [ ] Telemetry batching for efficiency
- [ ] Command timeout enforcement
- [ ] Agent status monitoring (degraded detection)
- [ ] Service health status updates Service model
- [ ] Policy model for command authorization
- [ ] Basic policy evaluation (requires_approval flag)
- [ ] OpenAPI documentation for agent APIs
- [ ] Agent installation script
- [ ] Migration guide from Phase 1

### Could Have (Nice to Have)

- [ ] Agent metrics dashboard
- [ ] Command execution history view
- [ ] Real-time incident dashboard updates
- [ ] Agent log streaming
- [ ] Bulk agent registration

---

## SECURITY REQUIREMENTS

### Authentication

- ✅ Separate agent token system (NOT user JWT)
- ✅ API key hashed with bcrypt (12 rounds)
- ✅ Short-lived JWT for agents (1h)
- ✅ API key stored securely on agent (0600 permissions)
- ✅ Token refresh mechanism

### Authorization

- ✅ Agent-specific permissions
- ✅ Command allowlist enforced
- ✅ Cross-org access prevented
- ✅ RBAC for admin operations

### Audit Trail

- ✅ Agent registration logged
- ✅ Agent authentication logged
- ✅ Command creation logged
- ✅ Command authorization logged
- ✅ Command execution logged
- ✅ Command completion logged
- ✅ All events have actor_id

### Command Safety

- ✅ Allowlist of command types
- ✅ No arbitrary shell execution
- ✅ Command expiry enforcement
- ✅ Protected processes list
- ✅ Timeout enforcement

---

## RISK MITIGATION

### Risk: Network Failures

**Mitigation:**
- Agent implements exponential backoff
- Local buffering of telemetry (bounded queue)
- Automatic reconnection
- Graceful degradation

### Risk: Agent Compromise

**Mitigation:**
- Agent can only access own organization
- Commands are allowlisted
- Protected processes cannot be killed
- API key revocation
- Command audit trail

### Risk: Backend Unavailability

**Mitigation:**
- Agent continues monitoring locally
- Telemetry buffered (with limits)
- Detection still works locally
- Reconnects automatically

### Risk: Database Overload

**Mitigation:**
- Telemetry retention policy (24h full, then aggregate)
- Heartbeat rate limiting
- Batched inserts
- Indexes on time-series queries

---

## DELIVERABLES

1. **Code**
   - 8 new backend models
   - 3 new API route files
   - Agent authentication middleware
   - WebSocket server setup
   - Refactored agent (TypeScript)
   - Migration script

2. **Database**
   - Migration 002_phase2_agent_integration.sql
   - 8 new tables
   - 20+ indexes

3. **Tests**
   - Agent registration tests
   - Agent authentication tests
   - Telemetry ingestion tests
   - Tenant isolation tests
   - Command lifecycle tests
   - Security tests

4. **Documentation**
   - PHASE_2_COMPLETE.md
   - PHASE_2_ARCHITECTURE.md
   - PHASE_2_SECURITY.md
   - PHASE_2_API.md
   - PHASE_2_AGENT_PROTOCOL.md
   - Agent installation guide
   - Migration guide

5. **Scripts**
   - agent/migrate.sh
   - Agent registration helper

---

## TIMELINE

**Total: 3-4 weeks**

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Agent Registration & Auth | Agents can register and authenticate |
| 2 | Telemetry & Heartbeat | Metrics flow to backend |
| 3 | Commands & Incidents | Commands work, incidents created |
| 4 | Testing & Documentation | All tests pass, docs complete |

---

## SUCCESS METRICS

**Phase 2 is successful when:**

1. ✅ Agent can register via API
2. ✅ Agent authenticates with backend
3. ✅ Real system metrics reach PostgreSQL
4. ✅ Detections create incidents in backend
5. ✅ Commands sent from backend execute on agent
6. ✅ All command execution is audited
7. ✅ File-based communication completely removed
8. ✅ Tests pass with >80% coverage
9. ✅ Local demo works end-to-end
10. ✅ Documentation is complete

**Demonstration Scenario:**

```
1. Register agent via dashboard
2. Agent connects and sends heartbeat
3. Agent reports metrics every 15 seconds
4. Simulate high CPU on monitored system
5. Agent detects high CPU
6. Backend creates incident
7. Dashboard shows new incident
8. Admin approves remediation command
9. Backend sends command to agent
10. Agent executes allowlisted command
11. Agent reports result
12. Backend records command in audit log
13. Service recovers
14. Incident transitions to resolved
```

---

**PHASE 2 STATUS: PLANNING COMPLETE - READY TO BEGIN IMPLEMENTATION**

---

