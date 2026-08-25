# AutoHealX Backend API

Production-grade backend API for AutoHealX incident management platform.

## Features

- ✅ **PostgreSQL Database** - Robust relational data model
- ✅ **JWT Authentication** - Secure token-based auth with refresh tokens
- ✅ **RBAC Authorization** - Role-based access control (OWNER, ADMIN, OPERATOR, VIEWER)
- ✅ **Multi-Tenancy** - Strict organization-level isolation
- ✅ **Incident Management** - Full lifecycle tracking with state machine
- ✅ **Audit Logging** - Comprehensive audit trail
- ✅ **Input Validation** - Request validation on all endpoints
- ✅ **Error Handling** - Centralized error handling with structured responses
- ✅ **Security** - Helmet, CORS, rate limiting, bcrypt password hashing
- ✅ **Logging** - Winston structured logging with rotation
- ✅ **Docker Support** - Multi-stage Dockerfile and Docker Compose

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt (12 rounds)
- **Validation**: express-validator
- **Logging**: Winston
- **Security**: Helmet, CORS, express-rate-limit

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Docker and Docker Compose (optional)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit .env and set:
# - DB_PASSWORD
# - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - JWT_REFRESH_SECRET (generate a different one)
```

### 3. Start PostgreSQL

**Option A: Docker**
```bash
cd ..
docker-compose up postgres -d
```

**Option B: Local Installation**
```bash
# Install PostgreSQL 15
# Create database
createdb autohealx
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm run build
npm start
```

### 6. Verify

```bash
# Health check
curl http://localhost:4000/health

# Readiness check
curl http://localhost:4000/ready
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user and organization
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (protected)
- `GET /api/v1/auth/me` - Get current user (protected)
- `POST /api/v1/auth/change-password` - Change password (protected)

### Incidents

- `GET /api/v1/incidents` - List incidents (protected, filtered by org)
- `GET /api/v1/incidents/:id` - Get incident details (protected)
- `POST /api/v1/incidents` - Create incident (protected)
- `PUT /api/v1/incidents/:id/status` - Update incident status (protected)
- `POST /api/v1/incidents/:id/events` - Add event to incident (protected)
- `GET /api/v1/incidents/:id/events` - Get incident timeline (protected)

### Health

- `GET /health` - Basic health check
- `GET /ready` - Readiness check (includes DB connectivity)

## Example Usage

### Register a New User

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123",
    "displayName": "Admin User",
    "organizationName": "Acme Corp"
  }'
```

### Login

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123"
  }'
```

### Create an Incident

```bash
curl -X POST http://localhost:4000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Database connection timeout",
    "description": "Users experiencing 503 errors",
    "severity": "critical",
    "service_id": "SERVICE_UUID"
  }'
```

## Database Schema

### Core Tables

- **organizations** - Multi-tenant organizations
- **users** - User accounts with password hashes
- **roles** - RBAC roles (OWNER, ADMIN, OPERATOR, VIEWER)
- **organization_members** - User-role mappings
- **projects** - Logical grouping of services
- **services** - Monitored services/applications
- **incidents** - Incident records with lifecycle
- **incident_events** - Immutable event timeline
- **audit_logs** - Compliance audit trail

### Relationships

- Organizations have many Users, Projects, Services, Incidents
- Users belong to one Organization
- Projects belong to one Organization, have many Services
- Services belong to one Organization, optionally one Project
- Incidents belong to one Organization, optionally one Project and Service
- Incident Events belong to one Incident

## RBAC Permissions

### OWNER
- manage_org
- manage_users
- manage_projects
- manage_services
- manage_policies
- approve_remediation
- view_incidents
- view_audit

### ADMIN
- manage_users
- manage_projects
- manage_services
- view_incidents
- manage_config

### OPERATOR
- view_incidents
- investigate_incidents
- approve_remediation

### VIEWER
- view_incidents
- view_services

## Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: Signed tokens with 8h access / 7d refresh expiry
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable origin whitelist
- **Helmet**: Security headers
- **Input Validation**: All inputs validated
- **SQL Injection Prevention**: Parameterized queries via Sequelize
- **Tenant Isolation**: Automatic organization_id filtering
- **Audit Logging**: All actions tracked with actor and IP

## Development

### Scripts

```bash
npm run dev          # Start with auto-reload
npm run build        # Compile TypeScript
npm start            # Run production build
npm run migrate      # Run database migrations
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm test             # Run tests
npm run type-check   # TypeScript type checking
```

### Adding a New API Route

1. Create controller in `src/controllers/`
2. Create route in `src/routes/`
3. Add validation in `src/validators/`
4. Register route in `src/app.ts`
5. Add tests in `tests/`

### Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration
│   ├── controllers/     # Request handlers
│   ├── models/          # Database models
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── validators/      # Request validation
│   ├── logging/         # Winston logger
│   ├── errors/          # Custom error classes
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server startup
├── database/
│   ├── migrations/      # SQL migrations
│   └── migrate.ts       # Migration runner
├── tests/               # Test files
└── logs/                # Log files (created at runtime)
```

## Docker Deployment

### Build Image

```bash
docker build -t autohealx-backend .
```

### Run with Docker Compose

```bash
# From project root
docker-compose up -d
```

### Environment Variables in Docker

Set in `docker-compose.yml` or use `.env` file in project root.

## Troubleshooting

### Database Connection Failed

- Check PostgreSQL is running: `docker ps` or `pg_isready`
- Verify DB credentials in `.env`
- Check DB_HOST (use `postgres` for Docker, `localhost` for local)

### JWT Token Errors

- Ensure JWT_SECRET is at least 32 characters
- Check token hasn't expired
- Verify Authorization header format: `Bearer <token>`

### Rate Limit Errors

- Wait 15 minutes or adjust RATE_LIMIT_* in `.env`

### Migration Errors

- Ensure database exists: `createdb autohealx`
- Check migration SQL for syntax errors
- Verify PostgreSQL version is 15+

## Production Deployment Checklist

- [ ] Generate secure random JWT secrets (32+ characters)
- [ ] Set strong DB_PASSWORD
- [ ] Use environment variables or secret management
- [ ] Set CORS_ORIGIN to production domain
- [ ] Set NODE_ENV=production
- [ ] Enable SSL/TLS for database connections
- [ ] Configure log rotation and monitoring
- [ ] Set up database backups
- [ ] Review and adjust rate limits
- [ ] Enable audit logging
- [ ] Implement monitoring and alerting
- [ ] Conduct security audit
- [ ] Load test the API

## Support

For issues and questions:
- Review `docs/PHASE_1_COMPLETE.md`
- Check `docs/IMPLEMENTATION_PLAN.md`
- Review `docs/ARCHITECTURE_DECISIONS.md`

## License

MIT
