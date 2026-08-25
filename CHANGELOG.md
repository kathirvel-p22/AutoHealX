# Changelog

All notable changes to the AutoHealX project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 2 - Agent Integration (Planned)
- WebSocket server for real-time communication
- Agent registration and authentication
- Metrics collection API
- Health check reporting
- Service discovery
- Alert thresholds and policies

### Phase 1 Enhancements (Optional)
- Projects API (CRUD)
- Services API (CRUD)
- Audit logging service layer
- Unit and integration tests
- OpenAPI/Swagger documentation

## [0.2.0] - 2026-08-25

### Added - Phase 1: Backend Foundation

#### Database
- PostgreSQL 15 database schema with 9 tables
- `organizations` table for multi-tenant isolation
- `users` table with bcrypt password hashing
- `roles` table for RBAC (OWNER, ADMIN, OPERATOR, VIEWER)
- `organization_members` table for user-role mapping
- `projects` table for service grouping
- `services` table for monitored services
- `incidents` table with lifecycle tracking
- `incident_events` table for immutable timeline
- `audit_logs` table for compliance
- Database migration script (`001_initial_schema.sql`)
- Migration runner (`database/migrate.ts`)
- Automatic timestamp updates via triggers
- Incident number generator function (INC-YYYYMMDD-XXXX)
- Optimized indexes for performance
- Foreign key constraints for data integrity
- Default roles seeding

#### Backend API
- Express.js REST API with TypeScript
- Sequelize ORM with 9 models
- JWT authentication (access + refresh tokens)
- bcrypt password hashing (12 rounds)
- RBAC authorization middleware
- Tenant isolation enforcement
- Rate limiting (100 requests per 15 minutes)
- Helmet security headers
- CORS configuration
- Input validation (express-validator)
- Centralized error handling
- Winston structured logging
- Request tracing with unique IDs
- Health and readiness endpoints

#### Authentication Endpoints
- `POST /api/v1/auth/register` - Register user and create organization
- `POST /api/v1/auth/login` - Authenticate and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/change-password` - Change password

#### Incident Management Endpoints
- `GET /api/v1/incidents` - List incidents (with filters)
- `GET /api/v1/incidents/:id` - Get incident details
- `POST /api/v1/incidents` - Create incident
- `PUT /api/v1/incidents/:id/status` - Update status
- `POST /api/v1/incidents/:id/events` - Add event
- `GET /api/v1/incidents/:id/events` - Get timeline

#### Health Endpoints
- `GET /health` - Basic health check
- `GET /ready` - Readiness check (includes DB)

#### Docker Support
- Backend Dockerfile (multi-stage build)
- Updated docker-compose.yml with PostgreSQL
- Health checks for all services
- Named volumes for persistence
- Network isolation

#### Documentation
- `QUICK_START.md` - Getting started guide
- `PHASE_1_SUMMARY.md` - Implementation summary
- `PHASE_1_VERIFICATION.md` - Testing checklist
- `backend/README.md` - API documentation
- `docs/PHASE_1_COMPLETE.md` - Detailed completion report
- `.env.example` files with security checklists

### Security Improvements
- Replaced plaintext localStorage passwords with JWT tokens
- Implemented bcrypt password hashing (12 rounds)
- Added RBAC with 4 roles and permission checking
- Enforced tenant isolation at middleware level
- Added rate limiting to prevent brute force attacks
- Enabled security headers via Helmet
- Configured CORS to prevent unauthorized access
- Added input validation on all endpoints
- Implemented audit logging foundation
- Removed all secrets from code (environment variables only)
- Added structured logging that never logs secrets

### Changed
- Migrated from file-based authentication to PostgreSQL
- Updated docker-compose.yml to include PostgreSQL and backend
- Reorganized project structure with backend directory

### Deprecated
- File-based authentication (to be removed in future)
- localStorage password storage (to be removed in future)

## [0.1.0] - Initial State (Before Phase 1)

### Existing Features (Preserved)
- React dashboard with device monitoring
- Agent monitoring with file-based communication
- Firebase integration for notifications
- Docker deployment support
- Basic incident detection

### Known Issues (To Be Addressed)
- ❌ Authentication uses plaintext passwords in localStorage
- ❌ File-based agent communication (security risk)
- ❌ No backend API
- ❌ No PostgreSQL database
- ❌ No RBAC or multi-tenancy
- ❌ Firebase misused (client-side should be server-side)
- ❌ No policy engine
- ❌ No incident management system

---

## Version History Summary

- **0.2.0** (2026-08-25): Phase 1 complete - Production backend foundation
- **0.1.0** (Initial): Original prototype state

## Migration Guide

### From 0.1.0 to 0.2.0

**Breaking Changes:**
- Authentication now requires backend API
- localStorage passwords no longer supported
- Users must register/login via API

**Migration Steps:**
1. Start PostgreSQL: `docker-compose up postgres -d`
2. Run migrations: `cd backend && npm run migrate`
3. Start backend: `npm run dev`
4. Update frontend to use API authentication (Phase 3)
5. Migrate existing users (manual process)

**What's Preserved:**
- Existing frontend dashboard (untouched)
- Agent monitoring (untouched)
- Docker deployment

**What's New:**
- Backend API on port 4000
- PostgreSQL database
- JWT authentication
- RBAC authorization
- Incident management API

---

## Acknowledgments

This release implements Phase 1 of the 11-phase incremental migration plan documented in:
- `docs/REPOSITORY_ASSESSMENT.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ARCHITECTURE_DECISIONS.md`
- `docs/TARGET_ARCHITECTURE.md`

All architectural decisions are documented and traceable.

---

*For detailed technical documentation, see `docs/PHASE_1_COMPLETE.md`*
