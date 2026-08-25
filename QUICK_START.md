# AutoHealX Quick Start Guide

Get AutoHealX running locally in under 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Git

## Option 1: Docker (Recommended for Testing)

### 1. Clone and Configure

```bash
git clone <repository-url>
cd AutoHealX-main

# Create environment file
cp .env.example .env

# Edit .env and set passwords and secrets
# Minimum required: DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET
```

### 2. Start All Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- Backend API (port 4000)
- Frontend web app (port 3000)
- Monitoring agent

### 3. Run Database Migration

```bash
# Run migration inside backend container
docker exec -it autohealx-backend npm run migrate
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

### 5. Create Your First User

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123",
    "displayName": "Admin User",
    "organizationName": "My Company"
  }'
```

## Option 2: Local Development

### 1. Start PostgreSQL

```bash
# Using Docker
docker-compose up postgres -d

# OR install PostgreSQL locally and create database
createdb autohealx
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
npm run migrate

# Start backend
npm run dev
```

Backend runs on http://localhost:4000

### 3. Frontend Setup (in new terminal)

```bash
cd dashboard

# Install dependencies
npm install

# Start frontend
npm run dev
```

Frontend runs on http://localhost:3000

## Verify Installation

### Check Health

```bash
# Backend health
curl http://localhost:4000/health

# Backend readiness (includes DB check)
curl http://localhost:4000/ready
```

### Test Authentication

```bash
# Register
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "displayName": "Test User",
    "organizationName": "Test Org"
  }'

# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

## Default Roles

After registration, users are assigned roles:
- **OWNER**: First user in organization (full control)
- **ADMIN**: User/project/service management
- **OPERATOR**: Incident investigation and approval
- **VIEWER**: Read-only access

## Next Steps

1. **Explore the API**: See `backend/README.md` for all endpoints
2. **Read Documentation**: Check `docs/` folder for architecture and implementation details
3. **Configure Monitoring**: Set up agent to report to backend API
4. **Add Projects**: Create projects to organize your services
5. **Add Services**: Register services to monitor
6. **Review Security**: Update JWT secrets and database passwords before production

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `docker ps` or `pg_isready`
- Verify `.env` file has all required variables
- Check logs: `docker logs autohealx-backend`

### Migration fails
- Ensure database exists: `createdb autohealx`
- Check PostgreSQL is accessible
- Verify DB credentials in `.env`

### Frontend can't connect to backend
- Check backend is running: `curl http://localhost:4000/health`
- Verify CORS_ORIGIN in backend `.env` includes frontend URL
- Check browser console for errors

### Docker Compose errors
- Ensure no port conflicts (3000, 4000, 5432)
- Check Docker daemon is running
- Try `docker-compose down` then `docker-compose up -d`

## Environment Variables Explained

### Required (.env in project root)
```bash
DB_PASSWORD=your_password          # PostgreSQL password
JWT_SECRET=32+_char_random_string  # Access token secret
JWT_REFRESH_SECRET=different_32+   # Refresh token secret
```

### Optional (.env in project root)
```bash
DB_NAME=autohealx                 # Database name
DB_USER=postgres                  # Database user
CORS_ORIGIN=http://localhost:3000 # Frontend URL
```

## Security Notes

⚠️ **Before Production:**
- Generate secure random secrets (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Use strong database password
- Set CORS_ORIGIN to your production domain
- Set NODE_ENV=production
- Enable SSL/TLS for database
- Never commit `.env` to version control

## Support

- **Documentation**: `docs/` folder
- **Backend API**: `backend/README.md`
- **Architecture**: `docs/ARCHITECTURE_DECISIONS.md`
- **Implementation Plan**: `docs/IMPLEMENTATION_PLAN.md`

---

**Ready to deploy to production?** See `docs/PHASE_1_COMPLETE.md` for production deployment checklist.
