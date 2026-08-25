# AutoHealX - Target Architecture

**Document Version:** 1.0.0  
**Date:** August 25, 2026  
**Status:** PLANNING DOCUMENT

---

## Executive Summary

This document defines the target production architecture for AutoHealX, transforming it from a browser-based demo application into a production-grade AI-assisted incident intelligence, policy-governed automated remediation, and recovery verification platform.

**Core Principle:**  
DETECT → UNDERSTAND → DECIDE → ACT → VERIFY → LEARN/ESCALATE

---

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  React Web     │  │  CLI Tools     │  │  Mobile App    │    │
│  │  Dashboard     │  │  (Future)      │  │  (Future)      │    │
│  └────────┬───────┘  └────────────────┘  └────────────────┘    │
└───────────┼──────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Express.js REST API + WebSocket/SSE                       │ │
│  │  • Authentication (JWT)                                    │ │
│  │  • Authorization (RBAC)                                    │ │
│  │  • Rate Limiting                                           │ │
│  │  • Request Validation                                      │ │
│  │  • API Versioning (/api/v1)                               │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────┼──────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                           │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  Organization   │  │   Environment   │  │     Agent       ││
│  │   Management    │  │   Management    │  │   Management    ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   Telemetry     │  │    Detection    │  │   Correlation   ││
│  │   Ingestion     │  │     Engine      │  │     Engine      ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   Root Cause    │  │   AI Reasoning  │  │     Policy      ││
│  │    Analysis     │  │     Engine      │  │     Engine      ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   Risk Engine   │  │  Remediation    │  │   Verification  ││
│  │                 │  │     Engine      │  │     Engine      ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   Escalation    │  │  Notification   │  │     Audit       ││
│  │     Engine      │  │    Service      │  │    Service      ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└───────────┼──────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   PostgreSQL   │  │     Redis      │  │   Message      │    │
│  │   (Primary DB) │  │  (Cache/Queue) │  │   Queue        │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  AutoHealX     │  │     Docker     │  │   Kubernetes   │    │
│  │    Agents      │  │      API       │  │  (Future)      │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   LLM API      │  │    Slack/      │  │   PagerDuty    │    │
│  │ (OpenAI/etc)   │  │    Teams       │  │   (Future)     │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Responsibilities

### 2.1 API Gateway

**Technology:** Express.js (Node.js)  
**Port:** 4000 (API), 4001 (WebSocket)

**Responsibilities:**
- Authentication (JWT-based)
- Authorization (RBAC)
- Request validation
- Rate limiting
- CORS handling
- API versioning
- WebSocket/SSE connections for real-time updates
- Request/response logging
- Error handling

**Key Endpoints:**
```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/organizations
GET    /api/v1/environments
POST   /api/v1/agents/register
GET    /api/v1/agents
POST   /api/v1/telemetry
GET    /api/v1/incidents
GET    /api/v1/incidents/:id
POST   /api/v1/incidents/:id/actions
GET    /api/v1/policies
POST   /api/v1/policies
GET    /api/v1/audit
WS     /api/v1/stream
```

### 2.2 Organization Management

**Responsibilities:**
- Organization CRUD
- User management
- Role management
- RBAC enforcement
- Multi-tenancy isolation

**Data Model:**
```typescript
interface Organization {
  id: string;
  name: string;
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;
  organizationId: string;
  email: string;
  passwordHash: string;
  displayName: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

interface Role {
  id: string;
  organizationId: string;
  name: 'ORG_ADMIN' | 'SRE_ADMIN' | 'ENGINEER' | 'OPERATOR' | 'VIEWER';
  permissions: string[];
}
```

### 2.3 Telemetry Ingestion

**Responsibilities:**
- Receive metrics from agents
- Validate telemetry data
- Normalize metrics
- Store in time-series optimized structure
- Queue for processing
- Handle high-frequency data

**Architecture:**
```
Agent → API Gateway → Validation → Queue → Workers → PostgreSQL
                                    ↓
                                  Redis Cache
```

**Schema:**
```typescript
interface TelemetryEvent {
  id: string;
  organizationId: string;
  environmentId: string;
  agentId: string;
  serviceId: string;
  type: 'METRIC' | 'LOG' | 'TRACE' | 'HEALTH_CHECK' | 'EVENT';
  timestamp: Date;
  data: Record<string, any>;
}

interface Metric {
  name: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
}
```

### 2.4 Detection Engine

**Responsibilities:**
- Threshold detection
- Rate-of-change detection
- Baseline comparison
- Anomaly detection
- Pattern recognition
- Incident creation
- Deduplication
- Cooldown management

**Detection Rules:**
```typescript
interface DetectionRule {
  id: string;
  organizationId: string;
  name: string;
  metric: string;
  operator: '>' | '<' | '==' | 'anomaly';
  threshold: number;
  duration: number; // seconds
  cooldown: number; // seconds
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
}
```

**Examples:**
- CPU > 95% for 3 consecutive intervals → CPU_SATURATION
- Memory > 90% for 2 minutes → MEMORY_PRESSURE
- HTTP 5xx rate > 10% → SERVICE_ERROR_SPIKE
- Container restart count > 3 in 5 minutes → CONTAINER_INSTABILITY

### 2.5 Correlation Engine

**Responsibilities:**
- Group related signals
- Temporal correlation
- Service dependency awareness
- Metric relationship analysis
- Reduce alert noise
- Build comprehensive incident view

**Algorithm:**
```
1. New signal arrives
2. Check for existing incidents (5-minute window)
3. Check service relationships
4. Check metric patterns
5. If correlated → add to existing incident
6. If not correlated → create new incident
```

### 2.6 Root Cause Analysis (RCA)

**Responsibilities:**
- Evidence collection
- Pattern matching
- Service dependency analysis
- Historical correlation
- Confidence scoring
- Generate hypothesis
- Prepare for AI reasoning

**RCA Output:**
```typescript
interface RootCauseAnalysis {
  incidentId: string;
  rootCause: string;
  confidence: number; // 0-1
  evidence: Evidence[];
  affectedServices: string[];
  recommendedActions: Action[];
  alternativeCauses: string[];
}

interface Evidence {
  type: 'METRIC' | 'LOG' | 'TRACE' | 'DEPLOYMENT' | 'CONFIG_CHANGE';
  sourceId: string;
  observation: string;
  timestamp: Date;
}
```

### 2.7 AI Reasoning Engine

**Responsibilities:**
- Summarize incidents
- Explain root causes
- Generate human-readable explanations
- Recommend remediation actions
- Provide confidence reasoning
- Generate escalation messages

**CRITICAL RULES:**
1. AI receives structured evidence (never raw telemetry)
2. AI output is schema-validated
3. AI does not execute commands
4. AI does not bypass policy
5. AI unavailability does not block detection

**Integration:**
```typescript
interface AIRequest {
  incidentId: string;
  evidence: Evidence[];
  metrics: MetricSnapshot[];
  serviceContext: ServiceContext;
  historicalContext: HistoricalIncident[];
}

interface AIResponse {
  diagnosis: {
    summary: string;
    confidence: number;
  };
  evidence: {
    sourceId: string;
    type: string;
    observation: string;
  }[];
  recommendedAction: {
    actionType: string;
    reason: string;
  };
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresApproval: boolean;
}
```

**Providers Supported:**
- OpenAI GPT-4
- Google Gemini
- Anthropic Claude
- Local LLM (future)

### 2.8 Policy Engine

**Responsibilities:**
- Policy CRUD operations
- Policy evaluation
- Risk classification
- Approval requirement determination
- Cooldown enforcement
- Retry limit enforcement
- Environment-specific rules

**Policy Schema:**
```typescript
interface RemediationPolicy {
  id: string;
  organizationId: string;
  environmentId: string; // null = all environments
  name: string;
  action: string; // from action catalog
  conditions: PolicyCondition[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresApproval: boolean;
  maxRetries: number;
  cooldownSeconds: number;
  enabled: boolean;
  allowedUsers: string[]; // user IDs who can approve
  timeWindow: {
    start: string; // HH:MM
    end: string;   // HH:MM
    timezone: string;
  };
}

interface PolicyCondition {
  field: string;
  operator: string;
  value: any;
}
```

**Default Policies:**
```
RESTART_CONTAINER:
  - Production: Requires approval if service is stateful
  - Dev/Staging: Auto-approved
  - Risk: MEDIUM
  
SCALE_SERVICE:
  - Production: Requires approval
  - Dev/Staging: Auto-approved
  - Risk: MEDIUM

DATABASE_CONFIGURATION_CHANGE:
  - All environments: Requires approval
  - Risk: CRITICAL
  
KILL_PROCESS:
  - Production: Requires approval
  - Dev/Staging: Auto-approved
  - Risk: HIGH
```

### 2.9 Risk Engine

**Responsibilities:**
- Classify action risk level
- Evaluate blast radius
- Check reversibility
- Assess production impact
- Calculate risk score

**Risk Factors:**
```
- Environment (PROD > STAGING > DEV)
- Service criticality
- Action reversibility
- Time of day (after-hours = higher risk)
- Recent change activity
- Historical success rate
- Blast radius (number of users affected)
```

### 2.10 Remediation Engine

**Responsibilities:**
- Execute approved actions
- Command validation
- Timeout enforcement
- Result capture
- Idempotency enforcement
- Loop detection
- Retry management

**Action Catalog:**
```typescript
type ActionType =
  | 'RESTART_CONTAINER'
  | 'STOP_CONTAINER'
  | 'START_CONTAINER'
  | 'SCALE_SERVICE'
  | 'ROLLBACK_DEPLOYMENT'
  | 'REMOVE_UNHEALTHY_INSTANCE'
  | 'RUN_HEALTH_CHECK'
  | 'CLEAR_CACHE'
  | 'TRIGGER_FAILOVER';

interface RemediationAction {
  id: string;
  incidentId: string;
  actionType: ActionType;
  target: string;
  parameters: Record<string, any>;
  requestedBy: string;
  approvedBy: string | null;
  policyId: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'SUCCESS' | 'FAILED';
  startTime: Date;
  endTime: Date;
  result: string;
}
```

**Execution Flow:**
```
1. Validate action type is in catalog
2. Validate target exists
3. Check policy approval
4. Check cooldown
5. Check retry limit
6. Generate idempotency key
7. Execute via agent
8. Capture result
9. Return to verification engine
```

### 2.11 Recovery Verification

**Responsibilities:**
- Post-action health checks
- Metric recovery validation
- API response validation
- Dependency health checks
- Determine RESOLVED vs FAILED status

**Verification Checklist:**
```typescript
interface VerificationPlan {
  incidentId: string;
  remediationId: string;
  checks: VerificationCheck[];
}

interface VerificationCheck {
  type: 'HEALTH_CHECK' | 'METRIC_CHECK' | 'API_CHECK' | 'DEPENDENCY_CHECK';
  target: string;
  expectedState: any;
  timeout: number;
  retries: number;
}

interface VerificationResult {
  remediationId: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  checks: {
    type: string;
    result: string;
    pass: boolean;
  }[];
  recoveryTime: number;
  recommendation: string;
}
```

**Example:**
```
After container restart:
1. Wait 10 seconds
2. Check container status = running
3. Check health endpoint returns 200
4. Check CPU < 80% for 30 seconds
5. Check error rate < 1% for 1 minute
6. Check dependencies responding
7. If all pass → RESOLVED
8. If any fail → FAILED → ESCALATE
```

### 2.12 Escalation Engine

**Responsibilities:**
- Determine escalation triggers
- Generate incident summary
- Include evidence
- Provide recommended next steps
- Route to appropriate channel/person
- Track acknowledgment

**Escalation Triggers:**
```
1. Policy blocks automatic remediation
2. Remediation fails
3. Verification fails
4. Critical severity + after-hours
5. Repeated incidents (3x in 1 hour)
6. Unknown root cause (confidence < 50%)
```

**Escalation Message Template:**
```
INCIDENT: INC-2026-08-25-001
SEVERITY: CRITICAL
SERVICE: payment-api
ENVIRONMENT: production

DETECTED: 2026-08-25 02:14:03 UTC
IMPACT: Payment requests failing (5xx rate: 42%)

ROOT CAUSE (92% confidence):
Database connection pool exhausted. Current connections: 100/100.
Recent deployment (v2.4.1) introduced connection leak.

EVIDENCE:
• Metric: db.connections.active = 100 (limit)
• Log: "Connection timeout after 30s" (158 occurrences)
• Deployment: v2.4.1 deployed 14 minutes ago
• Trace: Average DB query time increased from 45ms to 2100ms

ACTIONS ATTEMPTED:
✓ Health check executed
✗ Database configuration change rejected (requires approval)

WHY AUTOMATION STOPPED:
Database configuration changes require human approval per policy POL-2024-DB-001.

RECOMMENDED NEXT STEPS:
1. Review database connection pool configuration
2. Check for connection leaks in v2.4.1 code
3. Consider rolling back to v2.4.0
4. Approve connection pool increase (temporary fix)
5. Review application logs for connection lifecycle

CURRENT STATE:
• Payment API: DEGRADED
• Database: SATURATED
• Failover available: Yes (replica healthy)

RESPOND: https://autohealx.com/incidents/INC-2026-08-25-001
```

### 2.13 Notification Service

**Responsibilities:**
- Channel abstraction (Email, Slack, Webhook, PagerDuty)
- Template rendering
- Delivery tracking
- Retry on failure
- Rate limiting

**Channels:**
```typescript
interface NotificationChannel {
  id: string;
  organizationId: string;
  type: 'EMAIL' | 'SLACK' | 'WEBHOOK' | 'PAGERDUTY' | 'TEAMS';
  config: Record<string, any>;
  enabled: boolean;
}

interface Notification {
  id: string;
  incidentId: string;
  channelId: string;
  severity: string;
  subject: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt: Date;
  error: string | null;
}
```

### 2.14 Audit Service

**Responsibilities:**
- Log all privileged operations
- Track who, what, when, why
- Append-only logs
- Compliance reporting
- Security audit trail

**Audit Events:**
```typescript
interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}
```

**Audited Actions:**
- User login/logout
- Policy changes
- Manual remediation approval/rejection
- Agent registration
- Environment changes
- Service configuration
- Incident manual override

---

## 3. Data Architecture

### 3.1 PostgreSQL Schema

**Core Tables:**

```sql
-- Organizations & Users
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
  CONSTRAINT users_org_email_unique UNIQUE (organization_id, email)
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);

-- Environments & Services
CREATE TABLE environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- development, staging, production
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  environment_id UUID NOT NULL REFERENCES environments(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100), -- api, database, worker, etc.
  status VARCHAR(50) NOT NULL DEFAULT 'unknown',
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE service_dependencies (
  service_id UUID NOT NULL REFERENCES services(id),
  depends_on_service_id UUID NOT NULL REFERENCES services(id),
  relationship_type VARCHAR(50), -- sync, async, optional
  PRIMARY KEY (service_id, depends_on_service_id)
);

-- Agents
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  environment_id UUID NOT NULL REFERENCES environments(id),
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  capabilities JSONB,
  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Telemetry
CREATE TABLE telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  environment_id UUID NOT NULL REFERENCES environments(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  service_id UUID REFERENCES services(id),
  event_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telemetry_timestamp ON telemetry_events(timestamp DESC);
CREATE INDEX idx_telemetry_service ON telemetry_events(service_id, timestamp DESC);

-- Incidents
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
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
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

CREATE TABLE root_cause_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id),
  root_cause TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  evidence JSONB NOT NULL,
  recommended_actions JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Policies
CREATE TABLE remediation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  environment_id UUID REFERENCES environments(id),
  name VARCHAR(255) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  conditions JSONB NOT NULL,
  risk_level VARCHAR(50) NOT NULL,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  max_retries INT NOT NULL DEFAULT 3,
  cooldown_seconds INT NOT NULL DEFAULT 300,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Remediations
CREATE TABLE remediation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id),
  policy_id UUID REFERENCES remediation_policies(id),
  action_type VARCHAR(100) NOT NULL,
  target VARCHAR(500) NOT NULL,
  parameters JSONB,
  requested_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending_approval',
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  result TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Verification
CREATE TABLE verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remediation_action_id UUID NOT NULL REFERENCES remediation_actions(id),
  status VARCHAR(50) NOT NULL,
  checks JSONB NOT NULL,
  recovery_time INT,
  recommendation TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  channel_type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id),
  channel_id UUID NOT NULL REFERENCES notification_channels(id),
  severity VARCHAR(50) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP,
  error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Audit
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  resource_id VARCHAR(255),
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_org_time ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_user_time ON audit_logs(user_id, created_at DESC);
```

### 3.2 Redis Usage

**Purpose:** Caching, queues, sessions, rate limiting

**Data Structures:**

```
Sessions:
  session:{sessionId} → { userId, organizationId, expiresAt }

Rate Limiting:
  ratelimit:{userId}:{endpoint} → count
  TTL: 60 seconds

Caching:
  cache:incident:{incidentId} → incident object
  cache:policy:{policyId} → policy object
  TTL: 5 minutes

Queues:
  queue:telemetry → list of telemetry events
  queue:remediation → list of pending actions
  queue:notifications → list of pending notifications

Real-time:
  pubsub:incidents:{organizationId} → incident updates
  pubsub:agents:{agentId} → agent commands
```

---

## 4. Incident Lifecycle

```
┌─────────────┐
│  DETECTED   │  ← Detection engine creates incident
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  TRIAGING   │  ← Evidence collection starts
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ INVESTIGATING    │  ← Correlation + RCA
└──────┬───────────┘
       │
       ▼
┌─────────────┐
│  DIAGNOSED  │  ← Root cause identified + AI reasoning
└──────┬──────┘
       │
       ├───────────────────────────────────┐
       │                                   │
       ▼                                   ▼
┌──────────────────┐            ┌──────────────┐
│ ACTION_PENDING   │            │  ESCALATED   │  ← Policy blocks action
└──────┬───────────┘            └──────────────┘
       │                                ↓
       ▼                          (Human handles)
┌──────────────────┐
│ ACTION_APPROVED  │  ← Policy allows or human approves
└──────┬───────────┘
       │
       ▼
┌─────────────┐
│ REMEDIATING │  ← Remediation engine executes
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  VERIFYING  │  ← Recovery verification
└──────┬──────┘
       │
       ├─────────────────┬──────────────────┐
       │                 │                  │
       ▼                 ▼                  ▼
┌──────────┐     ┌──────────┐      ┌─────────────┐
│ RESOLVED │     │  FAILED  │      │  ESCALATED  │
└──────────┘     └────┬─────┘      └─────────────┘
       │              │                    │
       ▼              ▼                    ▼
┌──────────┐     ┌──────────┐      ┌─────────────┐
│  CLOSED  │     │  CLOSED  │      │  CLOSED     │
└──────────┘     └──────────┘      └─────────────┘
```

---

## 5. Agent Architecture

### 5.1 Agent Responsibilities

1. **Registration:** Authenticate and register with control plane
2. **Telemetry:** Collect and send metrics/logs/health
3. **Heartbeat:** Send periodic status updates
4. **Command Execution:** Execute approved remediation commands
5. **Verification:** Perform local health checks
6. **Security:** Validate commands, maintain secure connection

### 5.2 Agent Communication

```
Agent ←→ WebSocket ←→ API Gateway ←→ Business Logic
```

**Agent → Control Plane:**
- Registration request
- Heartbeat (every 30 seconds)
- Telemetry events (every 10-15 seconds)
- Command results
- Verification results

**Control Plane → Agent:**
- Registration approval
- Remediation commands
- Health check requests
- Configuration updates

### 5.3 Agent Security

**Authentication:**
```
1. Agent registers with API key
2. Control plane validates key
3. Control plane issues JWT token (1 hour TTL)
4. Agent uses JWT for all requests
5. Agent refreshes token before expiry
```

**Command Validation:**
```
1. Agent receives command
2. Validates command signature
3. Checks command is from allowlist
4. Validates parameters
5. Checks expiration
6. Executes
7. Reports result
```

**Credential Management:**
- Agent credentials stored securely (environment variables)
- API keys can be revoked
- Tokens expire
- No hard-coded credentials

---

## 6. Docker Integration (MVP)

### 6.1 Docker Monitoring

**Metrics Collected:**
```
- Container status (running, stopped, unhealthy)
- Container CPU usage
- Container memory usage
- Container restart count
- Health check status
- Network I/O
- Disk I/O
```

**Implementation:**
```javascript
const Docker = require('dockerode');
const docker = new Docker();

async function monitorContainers() {
  const containers = await docker.listContainers({ all: true });
  
  for (const container of containers) {
    const stats = await docker.getContainer(container.Id).stats({ stream: false });
    const health = await docker.getContainer(container.Id).inspect();
    
    sendMetrics({
      containerId: container.Id,
      containerName: container.Names[0],
      status: health.State.Status,
      cpuPercent: calculateCPU(stats),
      memoryPercent: calculateMemory(stats),
      restartCount: health.RestartCount,
      health: health.State.Health?.Status
    });
  }
}
```

### 6.2 Docker Remediation Actions

**Supported Actions:**
```
1. RESTART_CONTAINER
   - docker restart <container>
   
2. STOP_CONTAINER
   - docker stop <container>
   
3. START_CONTAINER
   - docker start <container>
   
4. REMOVE_UNHEALTHY_INSTANCE
   - docker-compose scale service=N-1
   - docker rm <container>
   
5. HEALTH_CHECK
   - docker inspect --format='{{.State.Health.Status}}'
```

### 6.3 Docker Verification

**Post-Restart Verification:**
```
1. Wait 10 seconds
2. Check container status = running
3. Check health status = healthy (if health check defined)
4. Check container not restarting
5. Check application responds (if HTTP service)
6. Monitor error logs for 1 minute
7. Declare RESOLVED or FAILED
```

---

## 7. Security Architecture

### 7.1 Authentication

**JWT-based authentication:**
```
1. User submits email + password
2. Backend validates credentials (bcrypt)
3. Backend generates JWT token
   - Payload: { userId, organizationId, roles }
   - Expiration: 8 hours
   - Secret: from environment variable
4. Frontend stores token (httpOnly cookie or localStorage with XSS protection)
5. All API requests include token in Authorization header
```

### 7.2 Authorization (RBAC)

**Roles:**
```
ORG_ADMIN:
  - Manage organization
  - Manage users
  - Configure environments
  - Configure policies
  - View all incidents
  - Approve all remediations

SRE_ADMIN:
  - Configure remediation policies
  - Manage integrations
  - Approve remediations
  - View all incidents
  - Manage agents

ENGINEER:
  - View incidents
  - Investigate incidents
  - Approve permitted actions (per policy)
  - View telemetry
  - View audit logs

OPERATOR:
  - Monitor incidents
  - Execute explicitly allowed operations
  - View dashboards

VIEWER:
  - Read-only access to all data
```

**Permission Check:**
```javascript
function checkPermission(user, action, resource) {
  const roles = getUserRoles(user.id);
  const permissions = roles.flatMap(r => r.permissions);
  
  const required = `${action}:${resource}`;
  return permissions.includes(required) || permissions.includes('*:*');
}
```

### 7.3 Data Security

**Encryption:**
- HTTPS for all external communication
- TLS for database connections
- Encrypted JWT tokens
- bcrypt for password hashing (cost factor 12)

**Secret Management:**
- Environment variables for sensitive config
- No secrets in code
- Agent credentials revocable
- Database credentials rotated

### 7.4 Input Validation

**All API inputs validated:**
```javascript
const { body, validationResult } = require('express-validator');

router.post('/api/v1/incidents',
  body('title').isString().isLength({ min: 1, max: 500 }),
  body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);
```

### 7.5 Rate Limiting

**API rate limits:**
```
- Authentication: 5 requests/minute/IP
- Agent telemetry: 1000 requests/minute/agent
- General API: 100 requests/minute/user
- Approval actions: 10 requests/minute/user
```

---

## 8. Deployment Architecture

### 8.1 Development Environment

```
docker-compose.yml:
  - autohealx-web (React frontend)
  - autohealx-api (Express backend)
  - autohealx-agent (monitoring agent)
  - postgres (database)
  - redis (cache/queue)
  - demo-app (for testing)
```

### 8.2 Production Environment (Future)

```
Kubernetes Cluster:
  - Frontend deployment (2+ replicas)
  - API deployment (3+ replicas)
  - Worker deployment (2+ replicas)
  - PostgreSQL (managed service or StatefulSet)
  - Redis (managed service or StatefulSet)
  - Load balancer (Ingress)
  - TLS termination
  
Agents:
  - Deployed on customer infrastructure
  - Connect to API via HTTPS/WSS
```

---

## 9. Migration Strategy

See separate document: `docs/IMPLEMENTATION_PLAN.md`

**High-level approach:**
1. Preserve existing React frontend (high quality)
2. Build Express backend API
3. Migrate auth to JWT + bcrypt
4. Set up PostgreSQL + migrations
5. Add Redis
6. Refactor agent to use API instead of files
7. Build incident management system
8. Build policy engine
9. Add Docker integration
10. Add verification engine
11. Add escalation engine
12. Production hardening
13. Testing

---

## 10. Success Metrics

**Technical Metrics:**
- Incident detection latency < 1 minute
- Remediation execution time < 30 seconds
- Verification time < 2 minutes
- API response time p95 < 500ms
- Agent heartbeat interval 30s ±5s
- Zero data loss on agent disconnection

**Business Metrics:**
- Mean Time To Detect (MTTD)
- Mean Time To Recover (MTTR)
- Automation success rate
- Remediation success rate
- Escalation rate
- False positive rate
- After-hours auto-resolution count
- Estimated manual operations saved

---

## Document Control

**Version:** 1.0.0  
**Status:** Approved for implementation  
**Next Review:** After Phase 1 completion  
**Stakeholders:** Development Team, Product Owner, Security Team

**Change Log:**
- 2026-08-25: Initial version (v1.0.0)
