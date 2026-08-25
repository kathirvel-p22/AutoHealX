# AutoHealX - Implementation Plan

**Document Version:** 1.0.0  
**Date:** August 25, 2026  
**Plan Type:** Incremental Migration Strategy  
**Duration:** 24 weeks (6 months estimated)

---

## Executive Summary

This implementation plan transforms AutoHealX from a demonstration platform into a production-grade AI-assisted incident intelligence and policy-governed self-healing system through **11 sequential phases**.

**Strategy:** Incremental migration preserving existing UI  
**Approach:** Build → Test → Deploy per phase  
**Risk Management:** Phase gates with acceptance criteria  
**Timeline:** 24 weeks (adjustable based on team size)

---

## Phase Overview

| Phase | Name | Duration | Risk | Dependencies |
|-------|------|----------|------|--------------|
| **Phase 0** | Assessment & Planning | ✅ COMPLETE | Low | None |
| **Phase 1** | Backend Foundation | 3 weeks | Medium | Phase 0 |
| **Phase 2** | Agent Refactor | 2 weeks | Medium | Phase 1 |
| **Phase 3** | Incident Management | 3 weeks | Medium | Phase 1, 2 |
| **Phase 4** | Root Cause Analysis | 2 weeks | Low | Phase 3 |
| **Phase 5** | Policy Engine | 3 weeks | High | Phase 3 |
| **Phase 6** | Remediation Engine | 2 weeks | High | Phase 2, 5 |
| **Phase 7** | Recovery Verification | 2 weeks | Medium | Phase 6 |
| **Phase 8** | Escalation & Notifications | 2 weeks | Low | Phase 7 |
| **Phase 9** | Security Hardening | 3 weeks | Critical | All previous |
| **Phase 10** | Testing & Validation | 3 weeks | Medium | All previous |
| **Phase 11** | Production Readiness | 2 weeks | Low | All previous |

**Total:** 27 weeks (~6.5 months)

---

## Phase 0: Assessment & Planning ✅ COMPLETE

**Duration:** ✅ COMPLETE  
**Status:** Documents created

### Deliverables
- ✅ REPOSITORY_ASSESSMENT.md
- ✅ IMPLEMENTATION_PLAN.md (this document)
- ⏳ ARCHITECTURE_DECISIONS.md (in progress)

### Outcomes
- Complete understanding of current codebase
- Identification of reusable components
- Risk assessment completed
- Migration strategy defined

---

## Phase 1: Backend Foundation

**Duration:** 3 weeks  
**Risk:** Medium  
**Team:** 1-2 backend engineers

### Objectives
Build production-grade Express backend with PostgreSQL, replacing file-based and localStorage systems.

### Tasks

#### Week 1: Project Structure & Database

**1.1 Create Backend Directory Structure**
```
backend/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── models/
│   ├── utils/
│   └── app.ts
├── migrations/
├── seeds/
├── tests/
├── .env.example
├── package.json
└── tsconfig.json
```

**1.2 Initialize Backend**
```bash
cd backend
npm init -y
npm install express cors helmet dotenv bcrypt jsonwebtoken
npm install express-validator morgan winston
npm install pg sequelize
npm install --save-dev typescript @types/node @types/express
npm install --save-dev ts-node nodemon
```

**1.3 PostgreSQL Setup**
- Install PostgreSQL locally or via Docker
- Create `autohealx` database
- Set up migration system (Sequelize or Knex)
- Create initial schema (organizations, users, roles)

**Database Schema (Priority Tables):**
```sql
-- Core authentication & authorization
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);

-- Add indexes
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
```

**1.4 Configuration Management**
```typescript
// src/config/database.ts
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'autohealx',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
};

// src/config/server.ts
export const serverConfig = {
  port: parseInt(process.env.PORT || '4000'),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY || '8h',
};
```

#### Week 2: Authentication & Authorization

**2.1 JWT Authentication System**
```typescript
// src/middleware/auth.ts
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, serverConfig.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**2.2 Password Hashing with bcrypt**
```typescript
// src/services/authService.ts
import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string, 
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**2.3 RBAC Middleware**
```typescript
// src/middleware/authorize.ts
export const authorize = (...roles: string[]) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    
    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

**2.4 Auth API Routes**
```typescript
// src/routes/auth.ts
router.post('/api/v1/auth/register', 
  validateRegistration, 
  authController.register
);

router.post('/api/v1/auth/login', 
  validateLogin, 
  authController.login
);

router.post('/api/v1/auth/logout', 
  authenticate, 
  authController.logout
);

router.get('/api/v1/auth/me', 
  authenticate, 
  authController.getCurrentUser
);
```

#### Week 3: Core APIs & Redis

**3.1 Redis Setup**
```bash
npm install redis ioredis
```

```typescript
// src/config/redis.ts
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
});
```

**3.2 Session Management**
```typescript
// src/services/sessionService.ts
export async function createSession(userId: string): Promise<string> {
  const sessionId = uuidv4();
  await redis.setex(
    `session:${sessionId}`, 
    28800, // 8 hours
    JSON.stringify({ userId, createdAt: Date.now() })
  );
  return sessionId;
}
```

**3.3 Organization & Environment APIs**
```typescript
// src/routes/organizations.ts
router.get('/api/v1/organizations', 
  authenticate, 
  organizationController.list
);

router.get('/api/v1/organizations/:id', 
  authenticate, 
  organizationController.get
);

router.post('/api/v1/organizations', 
  authenticate, 
  authorize('ORG_ADMIN'),
  organizationController.create
);

// src/routes/environments.ts
router.get('/api/v1/environments', 
  authenticate, 
  environmentController.list
);

router.post('/api/v1/environments', 
  authenticate, 
  authorize('ORG_ADMIN', 'SRE_ADMIN'),
  environmentController.create
);
```

**3.4 Request Validation**
```typescript
// src/middleware/validation.ts
import { body, validationResult } from 'express-validator';

export const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('displayName').optional().isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

**3.5 Error Handling**
```typescript
// src/middleware/errorHandler.ts
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    error: message,
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

**3.6 Logging**
```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### Testing Phase 1

**Unit Tests:**
```typescript
// tests/auth.test.ts
describe('Authentication', () => {
  test('should hash passwords securely', async () => {
    const hash = await hashPassword('test123');
    expect(hash).not.toBe('test123');
    expect(await verifyPassword('test123', hash)).toBe(true);
  });
  
  test('should generate valid JWT tokens', async () => {
    const token = generateToken({ userId: '123', roles: ['USER'] });
    const decoded = jwt.verify(token, serverConfig.jwtSecret);
    expect(decoded.userId).toBe('123');
  });
});
```

### Acceptance Criteria Phase 1

- [ ] PostgreSQL running with initial schema
- [ ] Backend Express server running on port 4000
- [ ] `/api/v1/auth/register` creates user with hashed password
- [ ] `/api/v1/auth/login` returns valid JWT token
- [ ] JWT authentication middleware works
- [ ] RBAC middleware blocks unauthorized access
- [ ] Redis caching operational
- [ ] All auth tests passing
- [ ] API documentation (OpenAPI) generated
- [ ] Docker Compose includes postgres + redis + backend

### Dependencies Updated

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.1",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "winston": "^3.11.0",
    "pg": "^8.11.3",
    "sequelize": "^6.35.0",
    "redis": "^4.6.12",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@types/express": "^4.17.21",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "supertest": "^6.3.3"
  }
}
```

### Deliverables Phase 1

- ✅ Working Express backend on port 4000
- ✅ PostgreSQL with migrations
- ✅ Redis integration
- ✅ JWT authentication system
- ✅ RBAC middleware
- ✅ Basic CRUD APIs for orgs/users/environments
- ✅ Structured logging
- ✅ Error handling
- ✅ Request validation
- ✅ Unit tests (>70% coverage)
- ✅ API documentation
- ✅ Updated Docker Compose

---

## Phase 2: Agent Refactor

**Duration:** 2 weeks  
**Risk:** Medium  
**Dependencies:** Phase 1 complete

### Objectives
Refactor agent to communicate via authenticated API instead of file system.

### Tasks

#### Week 1: Agent Registration & Authentication

**2.1 Agent Registration System**

**Backend:**
```typescript
// backend/src/routes/agents.ts
router.post('/api/v1/agents/register',
  authenticate,
  authorize('ORG_ADMIN', 'SRE_ADMIN'),
  agentController.register
);

// backend/src/services/agentService.ts
export async function registerAgent(data: AgentRegistration) {
  // Create agent record
  const agent = await Agent.create({
    organizationId: data.organizationId,
    environmentId: data.environmentId,
    name: data.name,
    capabilities: data.capabilities,
    status: 'pending'
  });
  
  // Generate API key
  const apiKey = generateSecureApiKey();
  await AgentCredential.create({
    agentId: agent.id,
    apiKey: await hashPassword(apiKey),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  });
  
  return { agent, apiKey }; // Return plaintext key only once
}
```

**Agent:**
```javascript
// agent/src/registration.js
async function registerWithControlPlane() {
  const response = await axios.post(`${API_URL}/api/v1/agents/register`, {
    name: os.hostname(),
    capabilities: ['docker', 'process_management', 'metrics_collection'],
    version: '2.0.0'
  }, {
    headers: { 'Authorization': `Bearer ${ADMIN_JWT}` }
  });
  
  // Store API key securely
  fs.writeFileSync('.agent_key', response.data.apiKey, { mode: 0o600 });
  
  console.log(`Agent registered: ${response.data.agent.id}`);
}
```

**2.2 JWT Token Exchange**
```javascript
// agent/src/auth.js
async function authenticate() {
  const apiKey = fs.readFileSync('.agent_key', 'utf8');
  
  const response = await axios.post(`${API_URL}/api/v1/agents/token`, {
    apiKey
  });
  
  return response.data.token; // JWT valid for 1 hour
}

let currentToken = null;
let tokenExpiry = null;

async function getValidToken() {
  if (!currentToken || Date.now() >= tokenExpiry) {
    currentToken = await authenticate();
    tokenExpiry = Date.now() + 50 * 60 * 1000; // Refresh before 1 hour
  }
  return currentToken;
}
```

#### Week 2: Telemetry API & WebSocket

**2.3 Telemetry Ingestion API**

**Backend:**
```typescript
// backend/src/routes/telemetry.ts
router.post('/api/v1/telemetry',
  authenticateAgent, // Special middleware for agent auth
  validateTelemetry,
  telemetryController.ingest
);

// backend/src/services/telemetryService.ts
export async function ingestTelemetry(data: TelemetryEvent) {
  // Validate agent has permission for this environment
  await validateAgentPermissions(data.agentId, data.environmentId);
  
  // Store in database
  await TelemetryEvent.create({
    organizationId: data.organizationId,
    environmentId: data.environmentId,
    agentId: data.agentId,
    serviceId: data.serviceId,
    eventType: data.type,
    timestamp: data.timestamp,
    data: data.data
  });
  
  // Publish to queue for processing
  await redis.lpush('telemetry:queue', JSON.stringify(data));
}
```

**Agent:**
```javascript
// agent/src/telemetry.js
async function sendMetrics(metrics) {
  const token = await getValidToken();
  
  await axios.post(`${API_URL}/api/v1/telemetry`, {
    type: 'METRIC',
    timestamp: Date.now(),
    data: {
      cpu: metrics.cpu.usage,
      memory: metrics.memory.usedPercent,
      processes: metrics.processes.topCPU.slice(0, 20)
    }
  }, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}
```

**2.4 WebSocket for Commands**

**Backend:**
```typescript
// backend/src/websocket/agentSocket.ts
import { Server } from 'socket.io';

export function setupAgentSocket(io: Server) {
  io.of('/agents').use(authenticateSocketAgent);
  
  io.of('/agents').on('connection', (socket) => {
    console.log(`Agent connected: ${socket.agentId}`);
    
    // Join agent-specific room
    socket.join(`agent:${socket.agentId}`);
    
    // Handle heartbeat
    socket.on('heartbeat', async (data) => {
      await Agent.update(
        { lastHeartbeat: new Date(), status: 'online' },
        { where: { id: socket.agentId } }
      );
    });
    
    socket.on('disconnect', async () => {
      await Agent.update(
        { status: 'offline' },
        { where: { id: socket.agentId } }
      );
    });
  });
}

// Send command to agent
export async function sendCommandToAgent(agentId: string, command: Command) {
  io.of('/agents').to(`agent:${agentId}`).emit('command', command);
}
```

**Agent:**
```javascript
// agent/src/websocket.js
import io from 'socket.io-client';

const socket = io(`${API_URL}/agents`, {
  auth: { token: await getValidToken() }
});

socket.on('connect', () => {
  console.log('Connected to control plane');
  
  // Send heartbeat every 30 seconds
  setInterval(() => {
    socket.emit('heartbeat', {
      status: 'online',
      metrics: getLastMetrics()
    });
  }, 30000);
});

socket.on('command', async (command) => {
  console.log(`Received command: ${command.type}`);
  
  // Validate command
  if (!validateCommand(command)) {
    socket.emit('command_result', {
      commandId: command.id,
      success: false,
      error: 'Invalid command'
    });
    return;
  }
  
  // Execute command
  const result = await executeCommand(command);
  
  // Report result
  socket.emit('command_result', {
    commandId: command.id,
    ...result
  });
});
```

**2.5 Remove File-Based Communication**
- Delete `config/killRequest.json` polling
- Delete `config/actionSignal.json` polling
- Delete file-based config updates
- Update agent to ONLY use API/WebSocket

### Testing Phase 2

```javascript
// tests/agent-integration.test.js
describe('Agent Integration', () => {
  test('agent registration', async () => {
    const response = await request(app)
      .post('/api/v1/agents/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'test-agent',
        capabilities: ['docker']
      });
    
    expect(response.status).toBe(201);
    expect(response.body.apiKey).toBeDefined();
  });
  
  test('telemetry ingestion', async () => {
    const response = await request(app)
      .post('/api/v1/telemetry')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        type: 'METRIC',
        data: { cpu: 45.2 }
      });
    
    expect(response.status).toBe(201);
  });
});
```

### Acceptance Criteria Phase 2

- [ ] Agent registers via API and receives API key
- [ ] Agent authenticates and receives JWT token
- [ ] Agent sends telemetry via POST /api/v1/telemetry
- [ ] Agent connects via WebSocket
- [ ] Agent sends heartbeat every 30 seconds
- [ ] Backend can send commands via WebSocket
- [ ] Agent validates and executes commands
- [ ] Agent reports command results
- [ ] File-based communication completely removed
- [ ] Integration tests passing
- [ ] Agent runs with zero file system dependencies

### Deliverables Phase 2

- ✅ Agent registration API
- ✅ Agent authentication system
- ✅ Telemetry ingestion API
- ✅ WebSocket command system
- ✅ Refactored agent using API only
- ✅ No more file-based communication
- ✅ Integration tests
- ✅ Agent documentation

---

## Phase 3: Incident Management

**Duration:** 3 weeks  
**Risk:** Medium  
**Dependencies:** Phase 1, 2 complete

### Objectives
Implement full incident lifecycle management with state machine, timeline, and evidence collection.

### Database Schema

```sql
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  environment_id UUID NOT NULL REFERENCES environments(id),
  service_id UUID REFERENCES services(id),
  incident_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'detected',
  severity VARCHAR(50) NOT NULL,
  detected_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id),
  event_type VARCHAR(100) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id),
  evidence_type VARCHAR(50) NOT NULL,
  source_id VARCHAR(255),
  observation TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_org ON incidents(organization_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_detected ON incidents(detected_at DESC);
CREATE INDEX idx_incident_events_incident ON incident_events(incident_id, created_at);
```

### Tasks

#### Week 1: Core Incident System

**3.1 Incident State Machine**
```typescript
// backend/src/services/incidentStateMachine.ts
export const INCIDENT_STATES = {
  DETECTED: 'detected',
  TRIAGING: 'triaging',
  INVESTIGATING: 'investigating',
  DIAGNOSED: 'diagnosed',
  ACTION_PENDING: 'action_pending',
  ACTION_APPROVED: 'action_approved',
  REMEDIATING: 'remediating',
  VERIFYING: 'verifying',
  RESOLVED: 'resolved',
  ESCALATED: 'escalated',
  FAILED: 'failed',
  CLOSED: 'closed'
} as const;

export const VALID_TRANSITIONS = {
  [INCIDENT_STATES.DETECTED]: [INCIDENT_STATES.TRIAGING],
  [INCIDENT_STATES.TRIAGING]: [INCIDENT_STATES.INVESTIGATING],
  [INCIDENT_STATES.INVESTIGATING]: [INCIDENT_STATES.DIAGNOSED, INCIDENT_STATES.ESCALATED],
  [INCIDENT_STATES.DIAGNOSED]: [INCIDENT_STATES.ACTION_PENDING, INCIDENT_STATES.ESCALATED],
  [INCIDENT_STATES.ACTION_PENDING]: [INCIDENT_STATES.ACTION_APPROVED, INCIDENT_STATES.ESCALATED],
  [INCIDENT_STATES.ACTION_APPROVED]: [INCIDENT_STATES.REMEDIATING],
  [INCIDENT_STATES.REMEDIATING]: [INCIDENT_STATES.VERIFYING, INCIDENT_STATES.FAILED],
  [INCIDENT_STATES.VERIFYING]: [INCIDENT_STATES.RESOLVED, INCIDENT_STATES.FAILED],
  [INCIDENT_STATES.FAILED]: [INCIDENT_STATES.ESCALATED],
  [INCIDENT_STATES.ESCALATED]: [INCIDENT_STATES.CLOSED],
  [INCIDENT_STATES.RESOLVED]: [INCIDENT_STATES.CLOSED]
};

export function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
}

export async function transitionIncident(
  incidentId: string, 
  newStatus: string, 
  userId: string, 
  reason?: string
) {
  const incident = await Incident.findByPk(incidentId);
  if (!incident) throw new Error('Incident not found');
  
  if (!canTransition(incident.status, newStatus)) {
    throw new Error(`Invalid transition: ${incident.status} → ${newStatus}`);
  }
  
  // Update status
  await incident.update({ status: newStatus });
  
  // Record event
  await IncidentEvent.create({
    incidentId,
    eventType: 'STATUS_CHANGE',
    description: `Status changed from ${incident.status} to ${newStatus}`,
    metadata: { from: incident.status, to: newStatus, userId, reason }
  });
  
  // Emit WebSocket event
  io.to(`org:${incident.organizationId}`).emit('incident:updated', incident);
  
  return incident;
}
```

**3.2 Incident Creation from Detection**
```typescript
// backend/src/services/incidentService.ts
export async function createIncidentFromDetection(detection: Detection) {
  const incidentNumber = await generateIncidentNumber();
  
  const incident = await Incident.create({
    organizationId: detection.organizationId,
    environmentId: detection.environmentId,
    serviceId: detection.serviceId,
    incidentNumber,
    title: detection.message,
    status: INCIDENT_STATES.DETECTED,
    severity: detection.severity,
    detectedAt: new Date()
  });
  
  // Add initial evidence
  await IncidentEvidence.create({
    incidentId: incident.id,
    evidenceType: 'METRIC',
    sourceId: detection.metricId,
    observation: detection.message,
    timestamp: detection.timestamp
  });
  
  // Record creation event
  await IncidentEvent.create({
    incidentId: incident.id,
    eventType: 'INCIDENT_CREATED',
    description: 'Incident detected and created',
    metadata: detection
  });
  
  // Start async investigation
  processIncidentAsync(incident.id);
  
  return incident;
}
```

#### Week 2: Detection Pipeline

**3.3 Detection Worker**
```typescript
// backend/src/workers/detectionWorker.ts
export async function processDetectionQueue() {
  while (true) {
    try {
      const telemetry = await redis.brpop('telemetry:queue', 5);
      if (!telemetry) continue;
      
      const event = JSON.parse(telemetry[1]);
      
      // Run detection rules
      const detections = await runDetectionRules(event);
      
      for (const detection of detections) {
        // Check for existing incident (deduplication)
        const existing = await findRecentIncident(detection);
        
        if (existing) {
          // Add evidence to existing incident
          await addEvidenceToIncident(existing.id, detection);
        } else {
          // Create new incident
          await createIncidentFromDetection(detection);
        }
      }
    } catch (error) {
      logger.error('Detection worker error:', error);
    }
  }
}
```

**3.4 Deduplication Logic**
```typescript
// backend/src/services/deduplicationService.ts
export async function findRecentIncident(detection: Detection) {
  // Look for incidents in last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const existing = await Incident.findOne({
    where: {
      organizationId: detection.organizationId,
      serviceId: detection.serviceId,
      status: {
        [Op.in]: ['detected', 'triaging', 'investigating', 'diagnosed']
      },
      detectedAt: {
        [Op.gte]: fiveMinutesAgo
      }
    },
    order: [['detectedAt', 'DESC']]
  });
  
  return existing;
}
```

#### Week 3: Evidence & Timeline

**3.5 Evidence Collection**
```typescript
// backend/src/services/evidenceService.ts
export async function collectEvidence(incidentId: string) {
  const incident = await Incident.findByPk(incidentId);
  
  // Collect metrics around detection time
  const metrics = await TelemetryEvent.findAll({
    where: {
      serviceId: incident.serviceId,
      eventType: 'METRIC',
      timestamp: {
        [Op.between]: [
          new Date(incident.detectedAt.getTime() - 5 * 60 * 1000),
          new Date(incident.detectedAt.getTime() + 5 * 60 * 1000)
        ]
      }
    }
  });
  
  // Store as evidence
  for (const metric of metrics) {
    await IncidentEvidence.create({
      incidentId,
      evidenceType: 'METRIC',
      sourceId: metric.id,
      observation: `${metric.data.name}: ${metric.data.value}`,
      timestamp: metric.timestamp
    });
  }
  
  // Check for recent deployments
  const deployments = await Deployment.findAll({
    where: {
      serviceId: incident.serviceId,
      deployedAt: {
        [Op.gte]: new Date(incident.detectedAt.getTime() - 30 * 60 * 1000)
      }
    }
  });
  
  for (const deployment of deployments) {
    await IncidentEvidence.create({
      incidentId,
      evidenceType: 'DEPLOYMENT',
      sourceId: deployment.id,
      observation: `Deployment to version ${deployment.version}`,
      timestamp: deployment.deployedAt
    });
  }
}
```

**3.6 Timeline API**
```typescript
// backend/src/routes/incidents.ts
router.get('/api/v1/incidents/:id/timeline',
  authenticate,
  incidentController.getTimeline
);

// backend/src/controllers/incidentController.ts
export async function getTimeline(req, res) {
  const events = await IncidentEvent.findAll({
    where: { incidentId: req.params.id },
    order: [['created_at', 'ASC']]
  });
  
  res.json({
    incidentId: req.params.id,
    timeline: events.map(e => ({
      timestamp: e.created_at,
      type: e.event_type,
      description: e.description,
      metadata: e.metadata
    }))
  });
}
```

### Testing Phase 3

```typescript
// tests/incident.test.ts
describe('Incident Management', () => {
  test('creates incident from detection', async () => {
    const detection = {
      organizationId: org.id,
      serviceId: service.id,
      severity: 'HIGH',
      message: 'CPU > 90%'
    };
    
    const incident = await createIncidentFromDetection(detection);
    expect(incident.status).toBe('detected');
    expect(incident.incidentNumber).toMatch(/INC-\d{4}-\d{2}-\d{2}-\d{3}/);
  });
  
  test('state machine prevents invalid transitions', async () => {
    await expect(
      transitionIncident(incident.id, 'resolved', user.id)
    ).rejects.toThrow('Invalid transition');
  });
  
  test('deduplicates similar incidents', async () => {
    // Create first incident
    const incident1 = await createIncidentFromDetection(detection);
    
    // Try to create duplicate
    const incident2 = await createIncidentFromDetection(detection);
    
    expect(incident2).toBeNull(); // Should be deduplicated
    
    const evidence = await IncidentEvidence.count({
      where: { incidentId: incident1.id }
    });
    expect(evidence).toBe(2); // Original + duplicate evidence
  });
});
```

### Acceptance Criteria Phase 3

- [ ] Incidents created from agent telemetry
- [ ] State machine enforces valid transitions
- [ ] Incident timeline shows all events
- [ ] Evidence collected and attached to incidents
- [ ] Deduplication prevents duplicate incidents within 5 minutes
- [ ] Dashboard displays incident list
- [ ] Dashboard displays incident detail with timeline
- [ ] WebSocket pushes incident updates to dashboard
- [ ] All incident tests passing

### Deliverables Phase 3

- ✅ Incident state machine
- ✅ Incident CRUD APIs
- ✅ Detection worker consuming telemetry queue
- ✅ Evidence collection system
- ✅ Deduplication logic
- ✅ Timeline API
- ✅ Dashboard incident views
- ✅ Real-time incident updates
- ✅ Integration tests

---

## Phase 4: Root Cause Analysis

**Duration:** 2 weeks  
**Dependencies:** Phase 3 complete

### Objectives
Build evidence-based RCA system with optional AI enhancement.

### Database Schema

```sql
CREATE TABLE root_cause_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id),
  root_cause TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  evidence JSONB NOT NULL,
  recommended_actions JSONB,
  alternative_hypotheses JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rca_incident ON root_cause_analyses(incident_id);
```

### Tasks

#### Week 1: Deterministic RCA

**4.1 Evidence-Based Analysis**
```typescript
// backend/src/services/rcaService.ts
export async function analyzeIncident(incidentId: string) {
  const incident = await Incident.findByPk(incidentId, {
    include: [IncidentEvidence, Service]
  });
  
  const evidence = incident.evidences;
  
  // Analyze evidence patterns
  const metrics = evidence.filter(e => e.evidenceType === 'METRIC');
  const deployments = evidence.filter(e => e.evidenceType === 'DEPLOYMENT');
  
  let rootCause = 'Unknown';
  let confidence = 0.5;
  let recommendedActions = [];
  
  // Rule 1: Recent deployment correlation
  if (deployments.length > 0) {
    const recentDeployment = deployments[0];
    const timeSinceDeployment = 
      incident.detectedAt - recentDeployment.timestamp;
    
    if (timeSinceDeployment < 30 * 60 * 1000) { // Within 30 minutes
      rootCause = `Issue detected ${Math.round(timeSinceDeployment/60000)} minutes after deployment to ${recentDeployment.observation}`;
      confidence = 0.85;
      recommendedActions.push({
        action: 'ROLLBACK_DEPLOYMENT',
        reason: 'Recent deployment correlation'
      });
    }
  }
  
  // Rule 2: CPU/Memory saturation
  const cpuMetrics = metrics.filter(e => e.observation.includes('CPU'));
  const highCPU = cpuMetrics.some(e => {
    const match = e.observation.match(/(\d+)%/);
    return match && parseInt(match[1]) > 90;
  });
  
  if (highCPU) {
    rootCause = 'CPU saturation detected. Process or traffic overload.';
    confidence = Math.max(confidence, 0.82);
    recommendedActions.push({
      action: 'SCALE_SERVICE',
      reason: 'CPU saturation'
    });
  }
  
  // Rule 3: Dependency failure
  // ... more rules
  
  const rca = await RootCauseAnalysis.create({
    incidentId,
    rootCause,
    confidence,
    evidence: evidence.map(e => ({
      type: e.evidenceType,
      observation: e.observation,
      timestamp: e.timestamp
    })),
    recommendedActions
  });
  
  await transitionIncident(incidentId, INCIDENT_STATES.DIAGNOSED, 'system');
  
  return rca;
}
```

#### Week 2: AI Enhancement (Optional)

**4.2 LLM Integration**
```typescript
// backend/src/services/aiService.ts
import { OpenAI } from 'openai';

export async function enhanceRCAWithAI(rca: RootCauseAnalysis) {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('AI enhancement skipped: No API key');
    return rca;
  }
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const prompt = `
You are analyzing a production incident.

Evidence:
${rca.evidence.map(e => `- ${e.type}: ${e.observation}`).join('\n')}

Current Analysis:
Root Cause: ${rca.rootCause}
Confidence: ${rca.confidence * 100}%

Provide:
1. A clear explanation of the root cause
2. Why this is the most likely cause
3. Alternative hypotheses
4. Recommended actions

Respond in JSON format.
  `.trim();
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are an SRE expert analyzing incidents.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3
  });
  
  const aiAnalysis = JSON.parse(response.choices[0].message.content);
  
  // Update RCA with AI insights
  await rca.update({
    rootCause: aiAnalysis.explanation || rca.rootCause,
    alternativeHypotheses: aiAnalysis.alternatives
  });
  
  return rca;
}
```

### Testing Phase 4

```typescript
// tests/rca.test.ts
describe('Root Cause Analysis', () => {
  test('detects deployment-related issues', async () => {
    // Create incident with recent deployment evidence
    const incident = await createTestIncident();
    await addDeploymentEvidence(incident.id, 5); // 5 minutes before
    
    const rca = await analyzeIncident(incident.id);
    
    expect(rca.rootCause).toContain('deployment');
    expect(rca.confidence).toBeGreaterThan(0.8);
  });
  
  test('identifies CPU saturation', async () => {
    const incident = await createTestIncident();
    await addMetricEvidence(incident.id, 'CPU: 95%');
    
    const rca = await analyzeIncident(incident.id);
    
    expect(rca.rootCause).toContain('CPU saturation');
  });
});
```

### Acceptance Criteria Phase 4

- [ ] RCA generated for every diagnosed incident
- [ ] Evidence-based rules work without AI
- [ ] AI enhancement optional (works if configured)
- [ ] Confidence scores realistic
- [ ] Recommended actions appropriate
- [ ] RCA API returns analysis
- [ ] Dashboard displays RCA
- [ ] All RCA tests passing

### Deliverables Phase 4

- ✅ Evidence-based RCA engine
- ✅ AI enhancement (optional)
- ✅ RCA API endpoints
- ✅ Dashboard RCA display
- ✅ Tests

---

## Phase 5: Policy Engine

**Duration:** 3 weeks  
**Risk:** High  
**Dependencies:** Phase 3 complete

### Objectives
Build database-driven policy engine with risk classification and approval workflows.

*(Due to length constraints, abbreviated - see detailed implementation in separate document)*

### Key Components
1. Policy CRUD APIs
2. Risk engine
3. Approval workflow
4. Environment-based rules
5. Cooldown enforcement
6. Retry limits

---

## Phases 6-11: Summary

*(Abbreviated for length - full details available upon request)*

### Phase 6: Remediation Engine (2 weeks)
- Action catalog
- Command validation
- Idempotency
- Docker API integration
- Safe execution

### Phase 7: Recovery Verification (2 weeks)
- Health check system
- Metric validation
- Verification plans
- Pass/fail determination

### Phase 8: Escalation & Notifications (2 weeks)
- Notification channels
- Escalation triggers
- Incident reports
- Acknowledgment tracking

### Phase 9: Security Hardening (3 weeks)
- Security audit
- Penetration testing
- Dependency updates
- HTTPS enforcement
- Rate limiting
- Input sanitization

### Phase 10: Testing & Validation (3 weeks)
- Unit tests (>80% coverage)
- Integration tests
- E2E tests
- Load testing
- Chaos testing

### Phase 11: Production Readiness (2 weeks)
- Documentation
- Deployment guides
- Monitoring setup
- Alerting
- Runbooks
- Final review

---

## Success Metrics

**Phase completion is measured by:**
- ✅ All acceptance criteria met
- ✅ All tests passing
- ✅ Documentation updated
- ✅ Security review passed
- ✅ Stakeholder approval

**MVP is complete when:**
- ✅ End-to-end demo works:
  ```
  Container crash → Detection → Policy → Restart → Verification → Resolved
  ```
- ✅ Security posture: GREEN (no critical vulnerabilities)
- ✅ Test coverage > 80%
- ✅ All documentation complete

---

## Risk Management

**High-Risk Phases:**
- Phase 5 (Policy Engine) - Complex business logic
- Phase 6 (Remediation) - Production impact
- Phase 9 (Security) - Vulnerabilities

**Mitigation:**
- Incremental testing after each task
- Security review at each phase gate
- Stakeholder demos at phase milestones

---

## Resource Requirements

**Team Composition:**
- 1-2 Backend Engineers
- 1 Frontend Engineer (part-time)
- 1 DevOps/SRE (part-time)
- 1 Security Engineer (consulting)

**Infrastructure:**
- PostgreSQL instance
- Redis instance
- Development environment
- CI/CD pipeline
- Testing infrastructure

---

## Document Control

**Version:** 1.0.0  
**Status:** Draft for approval  
**Next Review:** After Phase 1 completion  
**Owner:** Development Team Lead

**Approval Required From:**
- Technical Lead
- Security Team
- Product Owner
