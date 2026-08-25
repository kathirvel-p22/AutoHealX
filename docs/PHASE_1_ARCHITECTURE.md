# Phase 1 Architecture - Backend Foundation

**Status:** Implemented  
**Date:** August 25, 2026

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AutoHealX Phase 1                        │
│                     (Backend Foundation)                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │
│  React Frontend  │────────▶│  Express Backend │
│  (Port 3000)     │  HTTP   │  (Port 4000)     │
│                  │  REST   │                  │
└──────────────────┘         └────────┬─────────┘
                                      │
                                      │ SQL
                                      │ (Sequelize)
                                      ▼
                             ┌──────────────────┐
                             │                  │
                             │   PostgreSQL 15  │
                             │   (Port 5432)    │
                             │                  │
                             └──────────────────┘
```

## Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Express Backend                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   Middleware Pipeline                   │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  1. Request ID      → Unique tracing ID                │    │
│  │  2. Helmet          → Security headers                 │    │
│  │  3. CORS            → Cross-origin control             │    │
│  │  4. Rate Limiter    → 100 req/15min                    │    │
│  │  5. Body Parser     → JSON parsing (1MB limit)         │    │
│  │  6. Morgan          → Request logging                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                      API Routes                         │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  /health             → Health check                     │    │
│  │  /ready              → Readiness (DB) check            │    │
│  │  /api/v1/auth/*      → Authentication                  │    │
│  │  /api/v1/incidents/* → Incident management             │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │               Protected Route Middleware                │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  1. authenticate()      → JWT validation               │    │
│  │  2. authorize(perm)     → RBAC check                   │    │
│  │  3. tenantIsolation()   → org_id enforcement           │    │
│  │  4. validateRequest()   → Input validation             │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    Controllers                          │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  AuthController       → Handle auth requests           │    │
│  │  IncidentController   → Handle incident requests       │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                     Services                            │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  AuthService         → Business logic (bcrypt, JWT)    │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  Sequelize Models                       │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  User, Organization, Role, Incident, etc.              │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  Error Handler                          │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  - AppError (operational)                              │    │
│  │  - Sequelize errors                                    │    │
│  │  - JWT errors                                          │    │
│  │  - Unknown errors                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌─────────┐                                                    ┌──────────┐
│  Client │                                                    │ Database │
└────┬────┘                                                    └────┬─────┘
     │                                                              │
     │ POST /api/v1/auth/register                                  │
     │ { email, password, displayName, organizationName }          │
     ├────────────────────────────▶                                │
     │                                                              │
     │                         1. Validate input                   │
     │                         2. Hash password (bcrypt, 12 rounds)│
     │                         3. Create organization              │
     │                                  ├─────────────────────────▶│
     │                                  │ INSERT INTO organizations│
     │                                  │                          │
     │                         4. Create user                      │
     │                                  ├─────────────────────────▶│
     │                                  │ INSERT INTO users        │
     │                                  │                          │
     │                         5. Assign OWNER role                │
     │                                  ├─────────────────────────▶│
     │                                  │ INSERT INTO org_members  │
     │                                  │                          │
     │                         6. Generate JWT tokens              │
     │                                                              │
     │◀────────────────────────────────┤                           │
     │ { user, accessToken, refreshToken }                         │
     │                                                              │
     │                                                              │
     │ POST /api/v1/auth/login                                     │
     │ { email, password }                                         │
     ├────────────────────────────▶                                │
     │                                                              │
     │                         1. Find user by email               │
     │                                  ├─────────────────────────▶│
     │                                  │ SELECT * FROM users      │
     │                                  │                          │
     │                         2. Verify password (bcrypt.compare) │
     │                         3. Get user role                    │
     │                                  ├─────────────────────────▶│
     │                                  │ SELECT role FROM ...     │
     │                                  │                          │
     │                         4. Update last_login_at             │
     │                                  ├─────────────────────────▶│
     │                                  │ UPDATE users             │
     │                                  │                          │
     │                         5. Generate JWT tokens              │
     │                                                              │
     │◀────────────────────────────────┤                           │
     │ { user, accessToken, refreshToken, role }                   │
     │                                                              │
```

## Authorization Flow

```
┌─────────┐                                                    ┌──────────┐
│  Client │                                                    │ Database │
└────┬────┘                                                    └────┬─────┘
     │                                                              │
     │ GET /api/v1/incidents                                       │
     │ Authorization: Bearer <access_token>                        │
     ├────────────────────────────▶                                │
     │                                                              │
     │                         1. authenticate() middleware        │
     │                            - Extract token from header      │
     │                            - Verify JWT signature           │
     │                            - Decode payload                 │
     │                            - Attach user to request         │
     │                                                              │
     │                         2. authorize('view_incidents')      │
     │                                  ├─────────────────────────▶│
     │                                  │ SELECT permissions       │
     │                                  │ FROM roles               │
     │                                  │ WHERE id = user.role_id  │
     │                                  │                          │
     │                            - Check permission in role       │
     │                            - Throw 403 if missing           │
     │                                                              │
     │                         3. injectOrganizationId()           │
     │                            - Add org_id to res.locals       │
     │                                                              │
     │                         4. Controller: list()               │
     │                                  ├─────────────────────────▶│
     │                                  │ SELECT * FROM incidents  │
     │                                  │ WHERE org_id = user.org  │
     │                                  │                          │
     │◀────────────────────────────────┤                           │
     │ { success: true, data: { incidents: [...] } }               │
     │                                                              │
```

## Tenant Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│                     Multi-Tenant Architecture                    │
└─────────────────────────────────────────────────────────────────┘

Organization A                    Organization B
┌──────────────┐                 ┌──────────────┐
│  org_id: A   │                 │  org_id: B   │
├──────────────┤                 ├──────────────┤
│              │                 │              │
│  Users       │                 │  Users       │
│  ├─ User 1   │                 │  ├─ User 3   │
│  └─ User 2   │                 │  └─ User 4   │
│              │                 │              │
│  Projects    │                 │  Projects    │
│  └─ Proj A   │                 │  └─ Proj B   │
│              │                 │              │
│  Services    │                 │  Services    │
│  └─ Svc A1   │                 │  └─ Svc B1   │
│              │                 │              │
│  Incidents   │                 │  Incidents   │
│  └─ Inc A1   │                 │  └─ Inc B1   │
│              │                 │              │
└──────────────┘                 └──────────────┘
       │                                │
       │                                │
       └────────────┬───────────────────┘
                    │
                    ▼
         ┌────────────────────┐
         │  Isolation Rules   │
         ├────────────────────┤
         │ 1. Every resource  │
         │    has org_id      │
         │                    │
         │ 2. Middleware      │
         │    enforces filter │
         │                    │
         │ 3. DB queries auto │
         │    add WHERE       │
         │    org_id = X      │
         │                    │
         │ 4. No cross-org    │
         │    references      │
         └────────────────────┘
```

## Database Schema

```
┌─────────────────┐
│  organizations  │
├─────────────────┤
│ id (PK)         │──┐
│ name            │  │
│ status          │  │
│ created_at      │  │
│ updated_at      │  │
└─────────────────┘  │
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    users    │  │  projects   │  │  services   │
├─────────────┤  ├─────────────┤  ├─────────────┤
│ id (PK)     │  │ id (PK)     │  │ id (PK)     │
│ org_id (FK) │  │ org_id (FK) │  │ org_id (FK) │
│ email       │  │ name        │  │ project_id  │
│ password    │  │ description │  │ name        │
│ display_name│  │ status      │  │ environment │
│ status      │  └─────────────┘  │ status      │
└──────┬──────┘                   └──────┬──────┘
       │                                 │
       │                                 │
       │                                 │
   ┌───┴────┐                       ┌────┴─────┐
   ▼        ▼                       ▼          ▼
┌────────────────┐             ┌──────────────────┐
│ org_members    │             │    incidents     │
├────────────────┤             ├──────────────────┤
│ id (PK)        │             │ id (PK)          │
│ org_id (FK)    │             │ org_id (FK)      │
│ user_id (FK)   │             │ project_id (FK)  │
│ role_id (FK)   │             │ service_id (FK)  │
└────────┬───────┘             │ incident_number  │
         │                     │ title            │
         │                     │ severity         │
         ▼                     │ status           │
   ┌───────────┐               │ detected_at      │
   │   roles   │               └────────┬─────────┘
   ├───────────┤                        │
   │ id (PK)   │                        │
   │ name      │                        ▼
   │ permissions│              ┌──────────────────┐
   └───────────┘               │ incident_events  │
                               ├──────────────────┤
                               │ id (PK)          │
                               │ incident_id (FK) │
                               │ event_type       │
                               │ description      │
                               │ actor_id (FK)    │
                               │ metadata         │
                               │ created_at       │
                               └──────────────────┘

┌──────────────┐
│  audit_logs  │
├──────────────┤
│ id (PK)      │
│ org_id (FK)  │
│ user_id (FK) │
│ action       │
│ resource_type│
│ resource_id  │
│ metadata     │
│ ip_address   │
│ user_agent   │
│ created_at   │
└──────────────┘
```

## Incident State Machine

```
                    ┌──────────────┐
                    │   detected   │ ◀── Initial state
                    └───────┬──────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌───────────────┐         ┌─────────┐
        │ investigating │         │ closed  │
        └───────┬───────┘         └─────────┘
                │
                ▼
        ┌───────────────┐
        │  identified   │
        └───────┬───────┘
                │
                ▼
    ┌────────────────────────┐
    │ remediation_pending    │
    └───────────┬────────────┘
                │
                ▼
        ┌───────────────┐
        │  remediating  │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │   resolved    │───────────┐
        └───────┬───────┘           │
                │                   │
                │                   ▼
                │             ┌─────────┐
                └────────────▶│ closed  │
                              └────┬────┘
                                   │
                                   │ reopen
                                   │
                                   ▼
                          ┌──────────────┐
                          │   detected   │
                          └──────────────┘

Valid Transitions:
  detected → investigating, closed
  investigating → identified, closed
  identified → remediation_pending, closed
  remediation_pending → remediating, closed
  remediating → resolved, closed
  resolved → closed, detected (reopen)
  closed → detected (reopen)
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                       Security Layers                            │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Network
├─ Rate Limiting (100 req/15min)
├─ CORS (whitelist origins)
└─ Helmet (security headers)

Layer 2: Authentication
├─ JWT token validation
├─ Token signature verification
├─ Token expiry check
└─ Bearer token extraction

Layer 3: Authorization (RBAC)
├─ Role-based permissions
├─ Permission checking
└─ 403 on insufficient perms

Layer 4: Tenant Isolation
├─ Organization ID enforcement
├─ Automatic query filtering
├─ Cross-org access prevention
└─ Security logging

Layer 5: Input Validation
├─ Schema validation
├─ Type checking
├─ Length limits
└─ Format validation

Layer 6: Data Protection
├─ Password hashing (bcrypt, 12 rounds)
├─ Parameterized queries (SQL injection prevention)
├─ Request size limits (1MB)
└─ No secrets in logs

Layer 7: Audit Trail
├─ Action logging
├─ Actor tracking
├─ Immutable timeline
└─ IP and user agent recording
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                      Technology Stack                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Runtime & Language                                              │
│  ├─ Node.js 18+                                                  │
│  └─ TypeScript 5.3                                               │
│                                                                  │
│  Web Framework                                                   │
│  └─ Express.js 4.18                                              │
│                                                                  │
│  Database                                                        │
│  ├─ PostgreSQL 15                                                │
│  └─ Sequelize 6.35 (ORM)                                         │
│                                                                  │
│  Security                                                        │
│  ├─ bcrypt 5.1 (password hashing)                                │
│  ├─ jsonwebtoken 9.0 (JWT)                                       │
│  ├─ helmet 7.1 (security headers)                                │
│  ├─ cors 2.8 (CORS)                                              │
│  └─ express-rate-limit 7.1 (rate limiting)                       │
│                                                                  │
│  Validation & Errors                                             │
│  └─ express-validator 7.0                                        │
│                                                                  │
│  Logging                                                         │
│  ├─ winston 3.11 (structured logging)                            │
│  └─ morgan 1.10 (request logging)                                │
│                                                                  │
│  Development                                                     │
│  ├─ ts-node 10.9                                                 │
│  ├─ nodemon 3.0                                                  │
│  └─ eslint 8.56                                                  │
│                                                                  │
│  Deployment                                                      │
│  ├─ Docker 24+                                                   │
│  └─ Docker Compose 3.8                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| **Password Hashing** | 12 rounds | bcrypt, ~300ms per hash |
| **JWT Token Size** | ~500 bytes | Includes user context |
| **Token Expiry** | 8h access, 7d refresh | Configurable |
| **Rate Limit** | 100 req/15min | Per IP address |
| **Request Body Limit** | 1MB | Prevents DoS |
| **DB Connection Pool** | 2-10 connections | Configurable |
| **Log Rotation** | 10MB, 5 files | Per log type |

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Docker Compose Stack                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐                                          │
│  │ autohealx-postgres │ ← PostgreSQL 15 Alpine                  │
│  │ Port: 5432         │   Volume: postgres_data                 │
│  │ Health: pg_isready │                                          │
│  └──────────┬─────────┘                                          │
│             │                                                    │
│             │ depends_on: service_healthy                        │
│             │                                                    │
│  ┌──────────▼─────────┐                                          │
│  │ autohealx-backend  │ ← Node.js 18 Alpine                     │
│  │ Port: 4000         │   Multi-stage build                     │
│  │ Health: /health    │   Volume: backend_logs                  │
│  └──────────┬─────────┘                                          │
│             │                                                    │
│             │ depends_on                                         │
│             │                                                    │
│  ┌──────────▼─────────┐                                          │
│  │  autohealx-web     │ ← React SPA                             │
│  │  Port: 3000        │   Vite build                            │
│  │  Health: wget      │                                          │
│  └────────────────────┘                                          │
│                                                                  │
│  ┌────────────────────┐                                          │
│  │ autohealx-agent    │ ← Monitoring Agent                      │
│  │ No exposed ports   │   Volume: ./config                      │
│  └────────────────────┘                                          │
│                                                                  │
│  Network: autohealx-network (bridge)                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Next Phase Preview

```
Phase 2: Agent Integration
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────┐         WebSocket          ┌────────────┐      │
│  │   Agents   │◀───────────────────────────│  Backend   │      │
│  │            │                             │            │      │
│  │ - Register │         HTTP REST           │ - Metrics  │      │
│  │ - Report   │◀───────────────────────────│ - Alerts   │      │
│  │ - Metrics  │                             │ - Policies │      │
│  │            │                             │            │      │
│  └────────────┘                             └────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**For implementation details, see:**
- `docs/PHASE_1_COMPLETE.md` - Full technical documentation
- `backend/README.md` - API usage guide
- `QUICK_START.md` - Getting started guide
- `PHASE_1_VERIFICATION.md` - Testing checklist

---

*Architecture documented: August 25, 2026*
