# AutoHealX - Architecture Decisions

**Document Version:** 1.0.0  
**Date:** August 25, 2026  
**Status:** For Review and Approval

---

## Purpose

This document records major architectural decisions made during AutoHealX development, providing context, alternatives considered, and rationale for each choice.

---

## Decision Index

| ID | Decision | Status | Date |
|----|----------|--------|------|
| AD-001 | Incremental Migration vs Complete Rewrite | ✅ APPROVED | 2026-08-25 |
| AD-002 | PostgreSQL vs NoSQL Database | ✅ APPROVED | 2026-08-25 |
| AD-003 | Express.js vs Other Backend Frameworks | ✅ APPROVED | 2026-08-25 |
| AD-004 | JWT vs Session-Based Authentication | ✅ APPROVED | 2026-08-25 |
| AD-005 | WebSocket vs Polling for Agent Communication | ✅ APPROVED | 2026-08-25 |
| AD-006 | Monolith vs Microservices | ✅ APPROVED | 2026-08-25 |
| AD-007 | TypeScript vs JavaScript | ✅ APPROVED | 2026-08-25 |
| AD-008 | Policy Engine: Database vs Rules Engine | ✅ APPROVED | 2026-08-25 |
| AD-009 | AI Integration: Required vs Optional | ✅ APPROVED | 2026-08-25 |
| AD-010 | File-Based vs API-Based Agent Communication | ✅ APPROVED | 2026-08-25 |

---

## AD-001: Incremental Migration vs Complete Rewrite

### Context
AutoHealX has working React frontend, agent monitoring, and basic detection but lacks backend API, database, and critical security features.

### Decision
**CHOSEN:** Incremental migration strategy

### Alternatives Considered

**Option A: Incremental Migration** ✅ CHOSEN
- Build new backend alongside existing system
- Gradually migrate frontend to use backend APIs
- Preserve working UI and monitoring components
- Timeline: 6 months

**Option B: Complete Rewrite**
- Start fresh with proper architecture
- Discard all existing code
- Rebuild from specification
- Timeline: 4-5 months

**Option C: Patch Existing System**
- Add security patches to current architecture
- Keep file-based communication
- Minor improvements only
- Timeline: 2 months

### Rationale

**Why Incremental Migration:**
1. **Preserves Working Components**
   - React dashboard is production-quality
   - Agent monitoring system works well
   - Detection logic is solid
   - Rewriting these would waste effort

2. **Lower Risk**
   - Can validate each phase before proceeding
   - Existing system continues working during migration
   - Easier to roll back if needed

3. **Learning Opportunity**
   - Understand why current architecture has issues
   - Learn from existing implementation
   - Make better decisions with context

4. **Stakeholder Confidence**
   - Demonstrate progress incrementally
   - Maintain working demo throughout migration
   - Easier to justify resource allocation

**Why NOT Complete Rewrite:**
- Loses 6+ months of existing development
- Higher risk of missing requirements
- Temporary loss of working features
- All-or-nothing approach

**Why NOT Patch Existing:**
- Cannot fix fundamental architectural issues
- File-based communication unsalvageable
- Security issues require complete redesign
- Would accumulate more technical debt

### Consequences

**Positive:**
- Preserves $50k+ worth of existing development
- Lower migration risk
- Continuous working system
- Incremental validation

**Negative:**
- Longer overall timeline (6 months vs 4 months)
- Temporary code duplication during migration
- Need careful phase planning

**Trade-offs Accepted:**
- Speed (4 months) → Safety (6 months)
- Clean slate → Working foundation

### Status: ✅ APPROVED

---

## AD-002: PostgreSQL vs NoSQL Database

### Context
Current system uses localStorage + Firebase (NoSQL). Need production-grade database for multi-tenant incident management platform.

### Decision
**CHOSEN:** PostgreSQL

### Alternatives Considered

**Option A: PostgreSQL** ✅ CHOSEN
- Relational database
- ACID transactions
- Strong consistency
- Complex queries
- Foreign keys
- Migrations

**Option B: MongoDB**
- Document database
- Flexible schema
- Horizontal scaling
- JSON-native
- No joins

**Option C: Firebase Firestore**
- Serverless
- Real-time sync
- NoSQL
- Already integrated

**Option D: Hybrid (Postgres + Redis)**
- Postgres for structured data
- Redis for caching
- Best of both

### Rationale

**Why PostgreSQL:**

1. **Data Model Fits Perfectly**
   - Organizations → Users → Environments → Services → Incidents
   - Clear relational structure
   - Foreign key constraints ensure data integrity
   - Complex queries needed (incident correlation, policy matching)

2. **ACID Transactions Critical**
   - Incident state transitions must be atomic
   - Policy evaluation + action execution must be transactional
   - Cannot have partial incident creation
   - Money-back guarantee on data consistency

3. **Complex Queries Required**
   ```sql
   -- Example: Find related incidents
   SELECT i.* FROM incidents i
   JOIN services s ON i.service_id = s.id
   JOIN service_dependencies sd ON s.id = sd.service_id
   WHERE sd.depends_on_service_id = $1
   AND i.detected_at > NOW() - INTERVAL '5 minutes'
   AND i.status IN ('detected', 'triaging');
   ```
   This would be painful in NoSQL.

4. **Strong Consistency**
   - Incident state machine requires consistency
   - Policy engine cannot work with eventual consistency
   - RBAC requires immediate permission updates

5. **Multi-Tenancy**
   - Row-level security possible
   - Tenant isolation via foreign keys
   - Cannot accidentally leak data across tenants

6. **Mature Ecosystem**
   - Excellent Node.js drivers (pg, Sequelize)
   - Battle-tested in production
   - Rich monitoring tools
   - Easy backups

**Why NOT MongoDB:**
- Weak joins (would need manual correlation)
- Eventual consistency problematic for state machine
- Flexible schema unnecessary (we have strict requirements)
- Foreign key constraints missing

**Why NOT Firebase:**
- Not designed for complex relational queries
- NoSQL structure poor fit
- Vendor lock-in
- Cost at scale
- Client-side usage was security mistake

**Why NOT Pure Key-Value (Redis only):**
- No query capability
- Manual indexes
- No relationships
- Persistence concerns

### Hybrid Approach

**PostgreSQL (primary):**
- All structured data
- Incidents, policies, users, evidence

**Redis (secondary):**
- Session storage
- Rate limiting
- Job queues
- Caching frequently accessed data

### Consequences

**Positive:**
- Data integrity guaranteed
- Complex queries easy
- Standard SQL knowledge applicable
- Strong ecosystem
- Multi-tenant security

**Negative:**
- Horizontal scaling requires planning (sharding)
- Schema migrations needed for changes
- Slightly more setup than Firebase

**Trade-offs Accepted:**
- Easy scaling (MongoDB) → Data integrity (Postgres)
- Serverless (Firebase) → Control (Postgres)

### Supporting Evidence

**Industry Precedent:**
- Incident management: PagerDuty, Opsgenie use RDBMS
- ITSM: ServiceNow, Jira use RDBMS
- WHY: Complex relationships, transactions, queries

### Status: ✅ APPROVED

---

## AD-003: Express.js vs Other Backend Frameworks

### Context
Need Node.js backend framework for AutoHealX API.

### Decision
**CHOSEN:** Express.js

### Alternatives Considered

**Option A: Express.js** ✅ CHOSEN
- Mature, battle-tested
- Large ecosystem
- Flexible
- Minimalist core

**Option B: Fastify**
- Faster performance
- Built-in schema validation
- Modern architecture

**Option C: NestJS**
- TypeScript-native
- Angular-like structure
- Dependency injection
- More opinionated

**Option D: Koa**
- Modern middleware
- Express successor
- Smaller community

### Rationale

**Why Express:**

1. **Team Familiarity**
   - Most Node.js developers know Express
   - Extensive documentation
   - Huge Stack Overflow knowledge base
   - Lower onboarding time

2. **Ecosystem Maturity**
   - Thousands of middleware packages
   - Authentication: passport, express-jwt
   - Validation: express-validator
   - Documentation: swagger-ui-express
   - Everything has Express integration

3. **Flexibility**
   - Can structure as needed
   - Not forced into specific patterns
   - Easy to refactor
   - Gradual TypeScript migration possible

4. **Production Battle-Tested**
   - Used by: Uber, Accenture, Fox, IBM
   - Known scaling characteristics
   - Understood performance profile
   - Security patterns well-documented

**Why NOT Fastify:**
- Performance difference negligible for our use case
- Smaller community = fewer resources
- Less familiar to team

**Why NOT NestJS:**
- Over-engineered for our needs
- Forces specific architecture patterns
- Steeper learning curve
- Not incrementally adoptable from existing code

**Why NOT Koa:**
- Smaller community than Express
- Fewer middleware options
- Not significantly better for our use case

### Consequences

**Positive:**
- Quick development start
- Abundant resources
- Easy hiring (everyone knows Express)
- Flexible architecture

**Negative:**
- Not the absolute fastest (but fast enough)
- Requires discipline to structure well
- Some modern features require extra packages

**Trade-offs Accepted:**
- Absolute performance (Fastify) → Ecosystem maturity (Express)
- Strong opinions (NestJS) → Flexibility (Express)

### Status: ✅ APPROVED

---

## AD-004: JWT vs Session-Based Authentication

### Context
Need authentication system for AutoHealX API supporting web dashboard and agents.

### Decision
**CHOSEN:** JWT (JSON Web Tokens)

### Alternatives Considered

**Option A: JWT** ✅ CHOSEN
- Stateless
- Signed tokens
- Claims-based
- Works across services

**Option B: Session-Based**
- Server-side sessions
- Session store (Redis)
- Cookie-based
- Revocable immediately

**Option C: OAuth 2.0**
- Industry standard
- Delegation
- Complex setup

### Rationale

**Why JWT:**

1. **Stateless Authentication**
   - No session store lookup on every request
   - Scales horizontally without session sync
   - API gateway doesn't need session access
   - Agents can authenticate independently

2. **Microservices-Ready**
   - Token contains all needed information
   - No shared session store required
   - Services can verify tokens independently
   - Future-proof for service splitting

3. **Agent-Friendly**
   - Agents can store JWT
   - Token refresh straightforward
   - Works without cookies
   - Suitable for IoT/edge devices

4. **Standard Claims**
   ```json
   {
     "sub": "user-id",
     "org": "org-id",
     "roles": ["SRE_ADMIN"],
     "iat": 1234567890,
     "exp": 1234571490
   }
   ```
   Authorization decisions without DB lookup

**Session Advantages (Why NOT Session):**
- ✅ Immediate revocation
- ✅ Smaller cookies
- ✅ Server controls everything

**Session Disadvantages:**
- ❌ Requires session store (Redis)
- ❌ Harder to scale horizontally
- ❌ Not suitable for agents
- ❌ Cookie issues (CORS, mobile)

**Hybrid Approach:**
- JWT for authentication/authorization
- Redis for token blacklist (revocation)
- Refresh tokens stored server-side

### Implementation Details

**JWT Structure:**
```
Access Token: 1 hour expiry
Refresh Token: 7 days expiry, stored in httpOnly cookie
Token blacklist: Redis set with TTL
```

**Revocation:**
```typescript
// Add to blacklist
await redis.sadd('token:blacklist', tokenId);
await redis.expire(`token:blacklist:${tokenId}`, 3600);

// Check on each request
const isBlacklisted = await redis.sismember('token:blacklist', tokenId);
```

### Consequences

**Positive:**
- Scales horizontally
- Works for web + agents
- Standard authorization pattern
- Future microservices ready

**Negative:**
- Cannot revoke immediately (blacklist needed)
- Tokens can be large
- Clock synchronization important

**Trade-offs Accepted:**
- Immediate revocation (Session) → Stateless scaling (JWT)
- Simplicity (Session) → Flexibility (JWT)

### Status: ✅ APPROVED

---

## AD-005: WebSocket vs Polling for Agent Communication

### Context
Agents need to receive commands from control plane. Current implementation uses file polling.

### Decision
**CHOSEN:** WebSocket with fallback polling

### Alternatives Considered

**Option A: WebSocket** ✅ CHOSEN
- Persistent connection
- Bidirectional
- Real-time
- Server push

**Option B: Long Polling**
- HTTP-based
- Good compatibility
- Higher latency
- More overhead

**Option C: Server-Sent Events (SSE)**
- HTTP-based
- One-way (server → client)
- Simpler than WebSocket
- Good compatibility

**Option D: File System Polling** (current)
- No network needed
- Works locally
- Insecure
- Not scalable

### Rationale

**Why WebSocket:**

1. **Real-Time Commands**
   - Incident detected → immediate agent notification
   - No polling delay
   - Critical for time-sensitive remediation
   - Latency < 100ms

2. **Efficient**
   - One persistent connection
   - No repeated HTTP overhead
   - Lower bandwidth
   - Lower server load

3. **Bidirectional**
   - Agent → Telemetry
   - Control Plane → Commands
   - Heartbeat in both directions
   - Acknowledgments

4. **Connection State**
   - Know immediately if agent disconnects
   - Automatic reconnection
   - Better monitoring

**Why NOT Long Polling:**
- Higher latency (2-5 seconds typical)
- More server connections
- More complex implementation
- Not real-time

**Why NOT SSE:**
- One-way only (server → client)
- Would need separate channel for telemetry
- HTTP/1.1 connection limits
- Less feature-rich than WebSocket

**Why NOT File System:**
- Current method is insecure
- Not scalable
- Cannot work across network
- No authentication possible

### Implementation Strategy

**WebSocket with Fallback:**
```javascript
// Primary: WebSocket
const socket = io(controlPlaneUrl, {
  auth: { token: jwt },
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});

// Fallback: If WebSocket fails, use HTTP polling
socket.on('connect_error', () => {
  startPollingFallback();
});
```

**Benefits of Fallback:**
- Works behind restrictive firewalls
- Graceful degradation
- Development flexibility

### Consequences

**Positive:**
- Real-time command delivery
- Efficient bandwidth usage
- Connection state awareness
- Industry standard

**Negative:**
- More complex than HTTP
- Need WebSocket proxy for load balancing
- Requires connection management

**Trade-offs Accepted:**
- Simplicity (HTTP polling) → Performance (WebSocket)
- Compatibility (pure HTTP) → Real-time (WebSocket)

### Status: ✅ APPROVED

---

## AD-006: Monolith vs Microservices

### Context
Architectural pattern for AutoHealX backend services.

### Decision
**CHOSEN:** Modular Monolith initially, microservices-ready architecture

### Alternatives Considered

**Option A: Modular Monolith** ✅ CHOSEN
- Single deployment
- Modular code structure
- Internal boundaries
- Easy to split later

**Option B: Microservices from Start**
- Independent services
- Separate deployments
- Service mesh
- Complex orchestration

**Option C: Traditional Monolith**
- Single codebase
- No internal boundaries
- Simplest approach

### Rationale

**Why Modular Monolith:**

1. **Appropriate Scale**
   - MVP doesn't need microservices complexity
   - Team size: 1-4 developers
   - User scale: Thousands initially (not millions)
   - Premature optimization is wasteful

2. **Development Speed**
   - Single deployment = faster iterations
   - No distributed debugging
   - Simpler testing
   - Easier refactoring

3. **Clear Module Boundaries**
   ```
   src/
   ├── auth/           # Authentication module
   ├── incidents/      # Incident management
   ├── policies/       # Policy engine
   ├── remediation/    # Remediation engine
   ├── notifications/  # Notification service
   └── agents/         # Agent management
   ```

4. **Future-Proof**
   - Each module is a candidate microservice
   - Well-defined interfaces
   - Minimal coupling
   - Can extract services when needed

**When to Split to Microservices:**
- Independent scaling needs identified
- Team grows beyond 10 developers
- Different deployment schedules needed
- Clear service boundaries proven

**Why NOT Microservices Now:**
- Over-engineering for current scale
- Distributed system complexity
- Network latency
- Deployment complexity
- Debugging difficulty

**Why NOT Traditional Monolith:**
- Cannot split later
- Tight coupling inevitable
- Harder to maintain

### Module Communication

**Within Monolith:**
```typescript
// Direct function calls
import { createIncident } from './incidents/incidentService';
const incident = await createIncident(data);
```

**Future Microservice (same interface):**
```typescript
// HTTP call
const incident = await incidentServiceClient.createIncident(data);
```

**Key: Interface stays the same**

### Consequences

**Positive:**
- Fast development
- Simple deployment
- Easy debugging
- Lower operational overhead
- Can split later if needed

**Negative:**
- All-or-nothing scaling initially
- Single deployment unit
- Shared database (not a problem yet)

**Trade-offs Accepted:**
- Independent scaling (Microservices) → Simplicity (Monolith)
- Distributed (Microservices) → Fast development (Monolith)

### Status: ✅ APPROVED

**Review Trigger:** When team > 10 or clear scaling needs emerge

---

## AD-007: TypeScript vs JavaScript

### Context
Backend currently uses JavaScript (agent), frontend uses TypeScript.

### Decision
**CHOSEN:** TypeScript for all new code

### Rationale

**Why TypeScript:**

1. **Type Safety**
   - Catch errors at compile time
   - Refactoring confidence
   - Better IDE support
   - Self-documenting code

2. **Current Project**
   - Frontend already TypeScript
   - React components fully typed
   - Consistency across codebase
   - Type definitions for libraries

3. **Team Productivity**
   ```typescript
   // TypeScript
   function createIncident(data: IncidentData): Promise<Incident> {
     // IDE knows exact structure
     // Autocomplete works
     // Mistakes caught immediately
   }
   
   // JavaScript
   function createIncident(data) {
     // What's in data? 🤷
     // Typos only found at runtime
     // Documentation outdated?
   }
   ```

4. **Industry Standard**
   - Most new Node.js projects use TypeScript
   - Better hiring pool
   - Modern best practice

**Migration Strategy:**
- New backend: TypeScript from day 1
- Existing agent: Gradual migration
  - Add `.ts` files alongside `.js`
  - Use `allowJs` in tsconfig
  - Migrate file by file
  - No big-bang rewrite

### Consequences

**Positive:**
- Fewer runtime errors
- Better IDE experience
- Code is self-documenting
- Easier refactoring

**Negative:**
- Compilation step required
- Learning curve for pure JS developers
- Slightly more verbose

**Trade-offs Accepted:**
- Runtime flexibility (JS) → Compile-time safety (TS)
- Quick scripts (JS) → Production quality (TS)

### Status: ✅ APPROVED

---

## AD-008: Policy Engine - Database vs Rules Engine

### Context
Need system to evaluate whether automatic remediation is allowed.

### Decision
**CHOSEN:** Database-driven policies with in-memory caching

### Alternatives Considered

**Option A: Database Policies** ✅ CHOSEN
- Policies in PostgreSQL
- CRUD via UI
- Version history
- Complex queries

**Option B: Rules Engine (Drools-like)**
- DSL for rules
- Complex logic
- Rule chaining
- Steeper learning curve

**Option C: Code-Based Policies**
- Policies in code
- Requires deployment to change
- Type-safe
- No UI needed

### Rationale

**Why Database:**

1. **Dynamic Configuration**
   - SRE admins can update policies via UI
   - No code deployment needed
   - Immediate effect
   - Business users can understand

2. **CRUD Operations**
   ```sql
   UPDATE remediation_policies
   SET requires_approval = true
   WHERE environment = 'production'
   AND action_type = 'RESTART_SERVICE';
   ```
   Simple, transparent, auditable

3. **Query-Based Matching**
   ```sql
   SELECT * FROM remediation_policies
   WHERE organization_id = $1
   AND (environment_id = $2 OR environment_id IS NULL)
   AND action_type = $3
   AND enabled = true
   ORDER BY environment_id DESC NULLS LAST
   LIMIT 1;
   ```

4. **Version History**
   ```sql
   CREATE TABLE policy_history (
     id UUID PRIMARY KEY,
     policy_id UUID,
     changed_by UUID,
     changes JSONB,
     created_at TIMESTAMP
   );
   ```

**Why NOT Rules Engine:**
- Over-engineering for our complexity level
- Steeper learning curve
- Harder to debug
- Most power unused

**Why NOT Code:**
- Requires developer for policy changes
- Deployment needed
- Cannot adjust in emergency

### Caching Strategy

**Problem:** Policy evaluation on every action  
**Solution:** In-memory cache

```typescript
// Cache policies in memory
const policyCache = new Map<string, Policy>();

async function getApplicablePolicy(context: PolicyContext): Policy {
  const cacheKey = `${context.org}:${context.env}:${context.action}`;
  
  if (policyCache.has(cacheKey)) {
    return policyCache.get(cacheKey);
  }
  
  const policy = await PolicyModel.findApplicable(context);
  policyCache.set(cacheKey, policy);
  
  return policy;
}

// Invalidate on policy update
async function updatePolicy(policyId: string, changes: object) {
  await PolicyModel.update(policyId, changes);
  policyCache.clear(); // Simple invalidation
}
```

### Consequences

**Positive:**
- Dynamic policy updates
- UI-driven management
- Query-based matching
- Version history
- Audit trail

**Negative:**
- Cache invalidation complexity
- Database dependency for policy eval

**Trade-offs Accepted:**
- Ultimate flexibility (Rules Engine) → Simplicity (Database)
- Performance (Code) → Flexibility (Database)

### Status: ✅ APPROVED

---

## AD-009: AI Integration - Required vs Optional

### Context
Specification mentions AI for RCA and explanations. Current code has `@google/genai` but doesn't use it.

### Decision
**CHOSEN:** AI is optional enhancement, not requirement

### Rationale

**Why Optional:**

1. **Deterministic Core**
   - Evidence-based RCA works without AI
   - Rule-based detection reliable
   - Policy engine is deterministic
   - Platform functional without LLM

2. **Cost Control**
   - LLM API calls expensive at scale
   - Not all customers want AI costs
   - Can offer AI as premium feature
   - Free tier uses deterministic logic

3. **Reliability**
   - LLM provider outages don't break platform
   - Deterministic fallback always available
   - Critical incidents handled without AI
   - No single point of failure

4. **Privacy**
   - Some customers cannot send data to external LLMs
   - On-premise deployment without AI acceptable
   - Compliance requirements vary

**AI Enhancement Strategy:**

**Without AI (Base Platform):**
```
Detection → Evidence Collection → Deterministic RCA →
Policy → Remediation → Verification
```

**With AI (Enhanced):**
```
Detection → Evidence Collection → Deterministic RCA →
AI Explanation → Policy → Remediation → Verification
```

**AI Adds:**
- Human-readable explanations
- Alternative hypothesis generation
- Natural language incident summaries
- Recommended actions with reasoning

**AI Does NOT:**
- Make policy decisions
- Execute commands
- Bypass security
- Replace evidence

### Implementation

```typescript
// backend/src/services/rcaService.ts
export async function analyzeIncident(incidentId: string) {
  // Always: Deterministic analysis
  const baseRCA = await deterministicAnalysis(incident);
  
  // Optional: AI enhancement
  if (process.env.ENABLE_AI === 'true' && process.env.OPENAI_API_KEY) {
    baseRCA.aiExplanation = await enhanceWithAI(baseRCA);
  }
  
  return baseRCA;
}
```

### Consequences

**Positive:**
- Works without expensive LLM
- Privacy-friendly
- More reliable
- Cost-effective
- Gradual AI adoption

**Negative:**
- Less "impressive" without AI explanations
- Marketing challenge

**Trade-offs Accepted:**
- AI-first branding → Reliable core functionality
- Impressive demos → Production reliability

### Status: ✅ APPROVED

---

## AD-010: File-Based vs API-Based Agent Communication

### Context
Current agent uses file system for commands (`config/killRequest.json`). This is insecure and not scalable.

### Decision
**CHOSEN:** API-based communication with WebSocket

### Rationale

**Why This Is Critical:**

Current file-based system:
```javascript
// INSECURE - Anyone with file access can kill processes
const killRequestPath = path.join(__dirname, '../config/killRequest.json');
if (fs.existsSync(killRequestPath)) {
  const request = JSON.parse(fs.readFileSync(killRequestPath));
  await killProcess(request.pid);
}
```

**Problems:**
1. **No authentication** - Any file = command
2. **No authorization** - Cannot verify who approved
3. **No audit trail** - Limited logging
4. **Not network-capable** - localhost only
5. **Race conditions** - File conflicts possible
6. **No validation** - Malformed JSON crashes agent

**API-based solution:**
```javascript
// SECURE - Authenticated, authorized, audited
socket.on('command', async (command) => {
  // 1. Verify JWT signature
  if (!verifyCommandSignature(command)) return;
  
  // 2. Check command expiration
  if (command.expiresAt < Date.now()) return;
  
  // 3. Validate against allowlist
  if (!ALLOWED_ACTIONS.includes(command.type)) return;
  
  // 4. Execute
  const result = await executeCommand(command);
  
  // 5. Report result with audit trail
  socket.emit('command_result', {
    commandId: command.id,
    result,
    executedAt: Date.now(),
    agentId: AGENT_ID
  });
});
```

### Benefits

1. **Authentication**
   - JWT-based
   - Signature verification
   - Token expiration

2. **Authorization**
   - RBAC enforcement
   - Policy validation
   - Approval tracking

3. **Audit Trail**
   - Who approved
   - When command sent
   - When executed
   - What result

4. **Network-Capable**
   - Works across machines
   - Cloud deployment ready
   - Multi-agent support

5. **Reliable**
   - Message acknowledgment
   - Retry logic
   - Connection monitoring

### Migration Path

1. **Phase 1:** Add API endpoints (keep file system temporarily)
2. **Phase 2:** Agent supports both (feature flag)
3. **Phase 3:** Default to API
4. **Phase 4:** Remove file system completely

### Consequences

**Positive:**
- Secure command execution
- Network-capable
- Scalable
- Auditable
- Professional architecture

**Negative:**
- More complex than files
- Network dependency
- Connection management needed

**Trade-offs Accepted:**
- Simplicity (files) → Security (API)
- Localhost-only (files) → Network-capable (API)

### Status: ✅ APPROVED

---

## Decision Summary

| Decision | Why It Matters | Impact |
|----------|----------------|--------|
| Incremental Migration | Preserves $50k+ working code | Timeline: 6 months |
| PostgreSQL | Data integrity for incident management | Enables complex queries |
| Express.js | Fast development, large ecosystem | Quick MVP |
| JWT Auth | Scalable, stateless, agent-friendly | Future-proof |
| WebSocket | Real-time commands to agents | Low latency |
| Modular Monolith | Right-sized for MVP | Simple deployment |
| TypeScript | Type safety, fewer bugs | Better DX |
| Database Policies | Dynamic config without deployment | SRE control |
| Optional AI | Works without expensive LLM | Cost-effective |
| API Commands | Secure, auditable, scalable | Production-ready |

---

## Review and Approval

**These decisions should be reviewed by:**
- [ ] Technical Lead
- [ ] Senior Backend Engineer
- [ ] DevOps/SRE Engineer
- [ ] Security Engineer
- [ ] Product Owner

**Review Criteria:**
- Aligns with specification
- Addresses security concerns
- Feasible within timeline
- Team has required skills
- Reasonable trade-offs

**Approval Status:** PENDING REVIEW

---

## Living Document

This document will be updated as new architectural decisions are made during implementation. Each phase may introduce new decisions that should be recorded here.

**Next Review:** After Phase 1 completion

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-08-25  
**Status:** Draft for Review
