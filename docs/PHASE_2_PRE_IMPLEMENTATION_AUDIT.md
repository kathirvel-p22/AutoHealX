# Phase 2 Pre-Implementation Audit

**Date:** August 26, 2026  
**Phase:** Agent Integration  
**Status:** Audit Complete

---

## 🎯 Phase 2 Objective

Integrate the existing AutoHealX monitoring agent with the backend platform, enabling:
- Secure agent registration and authentication
- Real-time heartbeat transmission
- Telemetry data ingestion
- Detection event reporting
- Multi-tenant isolation
- Credential lifecycle management

---

## 🔍 Audit Methodology

1. **Backend API Layer Review** - Verify all required endpoints exist
2. **Existing Agent Review** - Understand current agent architecture
3. **Integration Gap Analysis** - Identify what needs to be built
4. **Security Assessment** - Verify authentication and authorization
5. **Testing Strategy** - Define acceptance criteria

---

## ✅ EXISTING: Backend Infrastructure (Phase 1)

### Database Schema ✅ COMPLETE
**Tables verified in PostgreSQL:**
```
agents                   (18 columns) ✅
agent_credentials        (7 columns)  ✅
agent_heartbeats         (7 columns)  ✅
telemetry_events         (9 columns)  ✅
detection_results        (13 columns) ✅
service_health_snapshots             ✅
commands                             ✅
command_events                       ✅
```

**Migration Status:**
- 001_initial_schema.sql ✅ Applied
- 002_phase2_agent_integration.sql ✅ Applied

### Backend Models ✅ COMPLETE

**Agent Model** (`backend/src/models/Agent.ts`)
```typescript
- id: UUID
- organization_id: UUID (tenant isolation)
- name: string
- hostname: string
- platform: 'windows' | 'linux' | 'darwin'
- version: string
- status: 'pending' | 'active' | 'inactive' | 'suspended' | 'revoked'
- last_heartbeat_at: Date
- metadata: JSONB
- created_at, updated_at
```

**AgentCredential Model** (`backend/src/models/AgentCredential.ts`)
```typescript
- id: UUID
- agent_id: UUID
- api_key_hash: string (bcrypt)
- expires_at: Date
- revoked_at: Date
- last_used_at: Date
- created_at
```

**AgentHeartbeat Model** (`backend/src/models/AgentHeartbeat.ts`)
```typescript
- id: UUID
- agent_id: UUID
- timestamp: Date
- status: 'healthy' | 'degraded' | 'unhealthy'
- metrics: JSONB
- services_count: number
- incidents_count: number
```

**TelemetryEvent Model** (`backend/src/models/TelemetryEvent.ts`)
```typescript
- id: UUID
- agent_id: UUID
- organization_id: UUID (tenant isolation)
- event_type: string
- timestamp: Date
- value: number
- unit: string
- metadata: JSONB
- created_at
```

**DetectionResult Model** (`backend/src/models/DetectionResult.ts`)
```typescript
- id: UUID
- agent_id: UUID
- organization_id: UUID (tenant isolation)
- incident_id: UUID (nullable)
- detection_type: string
- severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
- confidence: decimal (0-1)
- message: string
- suggested_action: string
- metadata: JSONB
- detected_at: Date
- created_at
```

### Backend Services ✅ COMPLETE

**agentService.ts** - All functions implemented:
- ✅ `registerAgent(data)` - Create agent + generate API key
- ✅ `authenticateAgent(apiKey)` - Verify API key → return JWT
- ✅ `verifyAgentToken(token)` - Verify JWT
- ✅ `getAgentById(id)`
- ✅ `listAgents(organizationId, filters)`
- ✅ `updateAgentStatus(id, status)`
- ✅ `revokeAgent(id)` - Revoke agent + all credentials
- ✅ `rotateApiKey(id)` - Generate new API key
- ✅ `recordHeartbeat(id, data)` - Store heartbeat + update last_heartbeat_at
- ✅ `isAgentOnline(id)` - Check if heartbeat within 2 minutes
- ✅ `getAgentHealthHistory(id, limit)`

**telemetryService.ts** - All functions implemented:
- ✅ `ingestTelemetry(data)` - Single event
- ✅ `batchIngestTelemetry(events)` - Batch events (1-1000)
- ✅ `queryTelemetry(filters)` - Query with filters
- ✅ `recordDetection(data)` - Store detection result
- ✅ `getUnprocessedDetections(orgId, limit)`
- ✅ `markDetectionProcessed(id, incidentId)`
- ✅ `getDetectionStats(orgId, hours)` - Statistics
- ✅ `getTelemetryStats(orgId, hours)` - Statistics

**Security Features:**
- ✅ API key generation (48-byte secure random)
- ✅ Bcrypt hashing (12 rounds)
- ✅ JWT token generation (1h expiry)
- ✅ Credential expiration checking
- ✅ Revocation support
- ✅ Tenant isolation validation
- ✅ Active status verification

### Backend Controllers ✅ COMPLETE

**agentController.ts** - All handlers implemented:
- ✅ `register` - POST /api/v1/agents/register
- ✅ `authenticate` - POST /api/v1/agents/authenticate
- ✅ `list` - GET /api/v1/agents/organizations/:organizationId
- ✅ `get` - GET /api/v1/agents/:id
- ✅ `updateStatus` - PATCH /api/v1/agents/:id/status
- ✅ `revoke` - POST /api/v1/agents/:id/revoke
- ✅ `rotateKey` - POST /api/v1/agents/:id/rotate-key
- ✅ `getHealth` - GET /api/v1/agents/:id/health
- ✅ `heartbeat` - POST /api/v1/agents/heartbeat

**telemetryController.ts** - All handlers implemented:
- ✅ `ingest` - POST /api/v1/telemetry
- ✅ `batchIngest` - POST /api/v1/telemetry/batch
- ✅ `recordDetection` - POST /api/v1/telemetry/detections
- ✅ `query` - GET /api/v1/telemetry
- ✅ `getDetections` - GET /api/v1/telemetry/detections
- ✅ `getStats` - GET /api/v1/telemetry/stats

### Backend Routes ✅ REGISTERED

**All routes registered in `app.ts`:**
```typescript
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/telemetry', telemetryRoutes);
```

**Validation middleware applied:**
- ✅ express-validator for all inputs
- ✅ `validateRequest` middleware
- ✅ `authenticate` for user endpoints
- ✅ `authenticateAgent` for agent endpoints
- ✅ `authorize` for RBAC

### Backend Middleware ✅ COMPLETE

**Authentication:**
- ✅ `authenticate.ts` - User JWT verification → `req.user`
- ✅ `authenticateAgent.ts` - Agent JWT verification → `req.agent`
- ✅ Type augmentation: `Express.Request.user` and `Express.Request.agent`

**Authorization:**
- ✅ `authorize.ts` - RBAC enforcement (OWNER, ADMIN, OPERATOR, VIEWER)

**Validation:**
- ✅ `validateRequest.ts` - express-validator integration

**Tenant Isolation:**
- ✅ `tenantIsolation.ts` - Organization-level isolation

---

## ⚠️ EXISTING: Agent Implementation (Firebase-based)

### Current Agent Architecture

**Location:** `agent/` directory

**Key Files:**
- `index.js` - Main orchestrator
- `monitor.js` - System metrics collection (systeminformation)
- `detector.js` - Basic threshold detection
- `advancedDetector.js` - Enhanced detection logic
- `healer.js` - Auto-remediation actions
- `intelligentEngine.js` - Decision engine
- `permissionSystem.js` - User approval system
- `knowledgeBase.js` - Learning/history
- `firebase.js` - **Firebase integration** ⚠️
- `bridgeSystem.js` - Communication layer

**Current Data Flow:**
```
Agent collects metrics
        ↓
Stores in Firebase/localStorage
        ↓
Frontend reads from Firebase/localStorage
```

**Current Dependencies:**
```json
{
  "chalk": "^4.1.2",
  "dotenv": "^16.3.1",
  "firebase-admin": "^12.0.0",     ← Firebase dependency
  "systeminformation": "^5.22.0"
}
```

**Agent Capabilities:**
- ✅ CPU monitoring
- ✅ Memory monitoring
- ✅ Process monitoring
- ✅ Disk monitoring
- ✅ Network monitoring
- ✅ GPU monitoring
- ✅ Threshold detection
- ✅ Intelligent analysis
- ✅ Auto-remediation (process kill, restart, etc.)
- ✅ Permission-based execution
- ⚠️ Firebase/localStorage storage (NOT backend API)

---

## 🚫 GAPS IDENTIFIED

### 1. ❌ NO API TESTING
**Issue:** Backend endpoints exist but have never been called

**Missing:**
- Unit tests for services
- Integration tests for controllers
- API tests for routes
- Security tests (RBAC, tenant isolation)
- Error handling tests

**Required:**
- Create test suite
- Test all agent endpoints
- Test all telemetry endpoints
- Verify tenant isolation
- Verify authentication flows

### 2. ❌ AGENT NOT INTEGRATED WITH BACKEND
**Issue:** Agent uses Firebase instead of AutoHealX backend

**Current State:**
```javascript
// agent/firebase.js
await writeMetrics(data)  // → Firebase
await writeAlert(alert)   // → Firebase
await writeFixLog(log)    // → Firebase
```

**Required State:**
```javascript
// agent/backendClient.js
await sendTelemetry(data)   // → Backend API
await sendDetection(alert)  // → Backend API
await recordHeartbeat()     // → Backend API
```

**Missing Components:**
- Backend HTTP client
- Agent registration flow
- Agent authentication flow
- Heartbeat transmission
- Telemetry transmission
- Detection transmission
- Error handling + retry logic
- Connection health monitoring

### 3. ❌ NO AGENT CONFIGURATION
**Issue:** Agent doesn't know how to connect to backend

**Required:**
```env
AUTOHEALX_BACKEND_URL=http://localhost:4000
AUTOHEALX_API_KEY=<generated-during-registration>
AUTOHEALX_AGENT_ID=<uuid-from-registration>
```

### 4. ❌ NO REGISTRATION WORKFLOW
**Issue:** No documented process for agent registration

**Required Flow:**
1. Admin creates organization
2. Admin logs into backend
3. Admin calls POST /api/v1/agents/register
4. Backend returns: `{ agent, apiKey }`
5. Admin configures agent with apiKey
6. Agent authenticates: POST /api/v1/agents/authenticate
7. Backend returns JWT
8. Agent uses JWT for all subsequent requests

### 5. ❌ NO SERVICE HEALTH SNAPSHOT MODEL
**Issue:** Table exists but no model file

**Status:**
- Table: `service_health_snapshots` ✅ exists in database
- Model: `ServiceHealthSnapshot.ts` ❌ missing
- Service: ❌ not implemented
- Controller: ❌ not implemented
- Routes: ❌ not implemented

### 6. ❌ NO COMMAND EXECUTION FLOW
**Issue:** Commands table exists but no implementation

**Status:**
- Table: `commands` ✅ exists
- Table: `command_events` ✅ exists
- Model: ❌ missing
- Service: ❌ missing
- Controller: ❌ missing
- Routes: ❌ missing

---

## 📋 PHASE 2 IMPLEMENTATION PLAN

### Priority 1: API Testing & Verification (Critical)
**Objective:** Prove backend endpoints work correctly

**Tasks:**
1. Create test organization + admin user
2. Test agent registration
3. Test agent authentication
4. Test heartbeat ingestion
5. Test telemetry ingestion
6. Test detection recording
7. Test query APIs
8. Verify tenant isolation
9. Test credential revocation
10. Test error cases

**Acceptance:**
- All agent endpoints return expected responses
- Tenant isolation verified
- Authentication works
- No security vulnerabilities found

### Priority 2: Agent Backend Client (Critical)
**Objective:** Enable agent to communicate with backend

**Tasks:**
1. Create `agent/backendClient.js`
2. Implement HTTP client (axios or fetch)
3. Implement authentication flow
4. Implement heartbeat transmission
5. Implement telemetry transmission
6. Implement detection transmission
7. Add retry logic
8. Add error handling
9. Add connection health monitoring
10. Replace Firebase calls with backend calls

**Acceptance:**
- Agent successfully registers
- Agent successfully authenticates
- Agent sends heartbeat every 15 seconds
- Agent sends telemetry
- Agent sends detections
- Data appears in database

### Priority 3: Agent Registration Workflow (High)
**Objective:** Document and automate agent provisioning

**Tasks:**
1. Create registration script/CLI
2. Document manual registration process
3. Create agent configuration template
4. Test registration flow
5. Verify API key security

**Acceptance:**
- New agent can be registered in < 5 minutes
- API key is generated securely
- Agent can authenticate immediately after registration

### Priority 4: Service Health Implementation (Medium)
**Objective:** Complete service health snapshot feature

**Tasks:**
1. Create ServiceHealthSnapshot model
2. Create service health service
3. Create service health controller
4. Create service health routes
5. Integrate with agent monitoring
6. Test service health reporting

**Acceptance:**
- Service health data can be recorded
- Service health data can be queried
- Agent can report service health

### Priority 5: Command Execution Framework (Low - Phase 8)
**Note:** This is part of remediation engine (Phase 8)

**Defer to Phase 8**

---

## 🧪 TESTING STRATEGY

### Unit Tests
**Target Coverage:** >80% for services

**Test Suites:**
- agentService.test.ts
- telemetryService.test.ts
- Agent model tests
- Credential model tests

### Integration Tests
**Test Suites:**
- Agent registration flow
- Agent authentication flow
- Heartbeat flow
- Telemetry ingestion flow
- Detection flow
- Tenant isolation
- RBAC enforcement

### API Tests
**Test Suites:**
- POST /api/v1/agents/register
- POST /api/v1/agents/authenticate
- POST /api/v1/agents/heartbeat
- POST /api/v1/telemetry
- POST /api/v1/telemetry/batch
- POST /api/v1/telemetry/detections
- GET /api/v1/agents/:id
- GET /api/v1/telemetry
- GET /api/v1/telemetry/stats

### Security Tests
**Test Cases:**
- Invalid API key → 401
- Expired API key → 401
- Revoked API key → 401
- Cross-tenant access → 403
- Missing authentication → 401
- Invalid JWT → 401
- RBAC violations → 403

### End-to-End Tests
**Test Scenario:**
```
1. Register organization
2. Create admin user
3. Login admin
4. Register agent
5. Configure agent with API key
6. Agent authenticates
7. Agent sends heartbeat
8. Verify heartbeat in database
9. Agent sends telemetry
10. Verify telemetry in database
11. Agent sends detection
12. Verify detection in database
13. Query agent health
14. Query telemetry
15. Query statistics
```

---

## 🔐 SECURITY VALIDATION

### Authentication
- ✅ API key generation (cryptographically secure)
- ✅ Bcrypt hashing (12 rounds)
- ✅ JWT generation (1h expiry)
- ✅ JWT verification
- ⚠️ Need to test credential expiration
- ⚠️ Need to test credential revocation
- ⚠️ Need to test JWT expiration handling

### Authorization
- ✅ RBAC middleware exists
- ✅ Role-based endpoint protection
- ⚠️ Need to test RBAC enforcement
- ⚠️ Need to test privilege escalation prevention

### Tenant Isolation
- ✅ organization_id in all relevant tables
- ✅ Tenant validation in services
- ⚠️ Need to test cross-tenant access prevention
- ⚠️ Need to test organization_id derivation from auth context

### Input Validation
- ✅ express-validator on all endpoints
- ✅ Schema validation
- ⚠️ Need to test malicious input rejection
- ⚠️ Need to test SQL injection prevention

### Secret Management
- ✅ API keys never logged
- ✅ Bcrypt hashing prevents plaintext storage
- ✅ JWT secrets in environment variables
- ⚠️ Need to verify secrets not in git
- ⚠️ Need to verify secrets not in logs

---

## 📊 ACCEPTANCE CRITERIA

Phase 2 is considered **COMPLETE** when:

### Backend API Layer
- [ ] All unit tests pass (>80% coverage)
- [ ] All integration tests pass
- [ ] All API tests pass
- [ ] All security tests pass
- [ ] TypeScript compilation = 0 errors
- [ ] Backend starts without errors
- [ ] All endpoints return correct responses
- [ ] Tenant isolation verified
- [ ] RBAC enforcement verified

### Agent Integration
- [ ] Agent can register with backend
- [ ] Agent can authenticate with backend
- [ ] Agent sends heartbeat every 15 seconds
- [ ] Agent sends telemetry to backend
- [ ] Agent sends detections to backend
- [ ] All data appears in PostgreSQL database
- [ ] Firebase dependency removed (or made optional)
- [ ] Agent handles network errors gracefully
- [ ] Agent reconnects after disconnection

### Documentation
- [ ] API documentation complete
- [ ] Agent integration guide complete
- [ ] Registration workflow documented
- [ ] Configuration guide complete
- [ ] Troubleshooting guide complete

### Git
- [ ] All changes committed
- [ ] All tests committed
- [ ] Documentation committed
- [ ] No secrets in git history

### Final Demonstration
- [ ] End-to-end workflow recorded
- [ ] Database state verified
- [ ] API logs verified
- [ ] Agent logs verified
- [ ] Multi-tenant test passed
- [ ] Security validation passed

---

## 🎯 SUCCESS METRICS

**Functional:**
- Agent → Backend communication: 100% success rate
- Heartbeat delivery: Every 15 seconds
- Telemetry delivery: Real-time
- Detection delivery: Immediate
- API response time: <100ms (p99)

**Security:**
- Authentication failure rate: 0% false positives
- Tenant isolation violations: 0
- RBAC bypass attempts: 0 successful
- Credential leaks: 0

**Quality:**
- Test coverage: >80%
- TypeScript errors: 0
- Linting errors: 0
- Security vulnerabilities: 0 critical, 0 high

---

## 📅 ESTIMATED TIMELINE

**Priority 1 - API Testing:** 4-6 hours
**Priority 2 - Agent Client:** 6-8 hours
**Priority 3 - Registration:** 2-4 hours
**Priority 4 - Service Health:** 4-6 hours

**Total Estimated:** 16-24 hours

---

## 🚀 NEXT STEPS

1. **Immediate:** Create test suite for backend APIs
2. **Next:** Implement agent backend client
3. **Then:** Test end-to-end integration
4. **Finally:** Document and commit Phase 2 completion

---

**Audit Status:** ✅ COMPLETE  
**Ready to Proceed:** ✅ YES  
**Blocker:** None

**Next Document:** `docs/PHASE_2_IMPLEMENTATION_GUIDE.md`
