# Phase 2 Testing - Complete Guide

**Date:** August 25, 2026  
**Status:** ✅ Code Fixed - Ready for Database Setup

---

## ✅ Completed Steps

1. ✅ **Code committed to GitHub**
2. ✅ **Dependencies installed** (626 packages)
3. ✅ **.env file created** with development settings
4. ✅ **TypeScript imports fixed** (3 files updated)
5. ✅ **Type definitions installed** (@types/pg)

---

## 🚀 Quick Start (3 Options)

### Option 1: Docker (Recommended)

```powershell
# 1. Start Docker Desktop (manually)
# 2. Start PostgreSQL container
cd "C:\Users\lapto\Downloads\AutoHealX-main\AutoHealX-main"
docker-compose up -d postgres

# 3. Wait for PostgreSQL to be ready
docker logs autohealx-postgres

# 4. Run migration
cd backend
npm run migrate

# 5. Start backend
npm run dev
```

### Option 2: Local PostgreSQL

```powershell
# 1. Install PostgreSQL 15 from postgresql.org
# 2. Create database
psql -U postgres -c "CREATE DATABASE autohealx;"

# 3. Run migration
cd backend
npm run migrate

# 4. Start backend
npm run dev
```

### Option 3: Cloud Database

```powershell
# 1. Create PostgreSQL instance (AWS RDS, Azure, etc.)
# 2. Update backend/.env with cloud credentials
# 3. Run migration
cd backend
npm run migrate

# 4. Start backend
npm run dev
```

---

## 📝 Current Configuration

### backend/.env
```env
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autohealx
DB_USER=postgres
DB_PASSWORD=postgres123
JWT_SECRET=autohealx_development_jwt_secret_key_32_characters_minimum_length_required
```

---

## 🧪 Testing Procedure

### 1. Verify Backend Starts

```bash
cd backend
npm run dev
```

**Expected output:**
```
[INFO] AutoHealX Backend starting...
[INFO] Database connected successfully
[INFO] Server listening on port 4000
```

### 2. Test Health Endpoint

```bash
curl http://localhost:4000/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-25T..."
}
```

### 3. Test API Root

```bash
curl http://localhost:4000/api/v1
```

**Expected:**
```json
{
  "service": "AutoHealX Backend",
  "version": "v1",
  "status": "running"
}
```

### 4. Register Admin User

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@example.com\",
    \"password\": \"SecurePass123!\",
    \"displayName\": \"Admin User\",
    \"organizationName\": \"Test Organization\"
  }"
```

### 5. Login as Admin

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@example.com\",
    \"password\": \"SecurePass123!\"
  }"
```

**Save the token from response**

### 6. Register Agent

```bash
curl -X POST http://localhost:4000/api/v1/agents/register \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"organizationId\": \"YOUR_ORG_ID\",
    \"name\": \"test-agent\",
    \"hostname\": \"test-server\",
    \"platform\": \"win32\",
    \"version\": \"2.0.0\",
    \"capabilities\": [\"metrics_collection\"]
  }"
```

**Save the apiKey and agentId from response**

### 7. Activate Agent

```bash
curl -X PATCH http://localhost:4000/api/v1/agents/AGENT_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"active\"}"
```

### 8. Authenticate Agent

```bash
curl -X POST http://localhost:4000/api/v1/agents/authenticate \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"YOUR_API_KEY\"}"
```

**Save the agent token**

### 9. Send Heartbeat

```bash
curl -X POST http://localhost:4000/api/v1/agents/heartbeat \
  -H "Authorization: Bearer YOUR_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"online\",
    \"cpuUsage\": 45.2,
    \"memoryUsage\": 68.5
  }"
```

### 10. Send Telemetry

```bash
curl -X POST http://localhost:4000/api/v1/telemetry \
  -H "Authorization: Bearer YOUR_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventType\": \"METRIC\",
    \"data\": {\"cpu\": 45.2, \"memory\": 68.5}
  }"
```

---

## 📊 Verification Checklist

After completing all steps:

- [ ] Backend starts without errors
- [ ] Health endpoint returns 200
- [ ] Can register admin user
- [ ] Can login and get JWT token
- [ ] Can register agent
- [ ] Can activate agent
- [ ] Can authenticate agent
- [ ] Can send heartbeat
- [ ] Can send telemetry
- [ ] Data appears in database

---

## 🗄️ Database Verification

```sql
-- Connect to database
psql -U postgres -d autohealx

-- Check tables
\dt

-- Check agents
SELECT id, name, status FROM agents;

-- Check telemetry
SELECT COUNT(*) FROM telemetry_events;

-- Check heartbeats
SELECT COUNT(*) FROM agent_heartbeats;
```

---

## 🐛 Troubleshooting

### Issue: "Database connection failed"

**Solution 1:** Check PostgreSQL is running
```bash
docker ps | grep postgres
```

**Solution 2:** Check connection settings
```bash
cat backend/.env
```

**Solution 3:** Test direct connection
```bash
psql -h localhost -U postgres -d autohealx
```

### Issue: "Port 4000 already in use"

**Solution:** Kill process on port 4000
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process
```

### Issue: "Module not found"

**Solution:** Reinstall dependencies
```bash
cd backend
rm -rf node_modules
npm install
```

---

## 📋 What to Do Now

Since Docker Desktop is not running and PostgreSQL is not installed:

### Recommended: Start Docker

1. **Launch Docker Desktop**
2. **Wait for it to start** (check system tray)
3. **Run the commands above**

### Alternative: Install PostgreSQL

If you prefer not to use Docker:
1. Download PostgreSQL 15 from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the postgres password
4. Update backend/.env with the password
5. Run the commands above

---

## 🎯 Success Criteria

Phase 2 Week 1 is verified when:

✅ All 10 test steps complete successfully  
✅ Data appears in PostgreSQL  
✅ No errors in backend logs  
✅ All endpoints return expected responses

---

## 📞 Next Steps

After successful testing:

1. **Commit any fixes:**
   ```bash
   git add .
   git commit -m "fix: TypeScript import issues"
   git push
   ```

2. **Begin Week 2:**
   - Refactor agent to use API
   - Remove file-based communication
   - Implement batch telemetry

3. **Deploy to staging:**
   - Use docker-compose for full stack
   - Test with real agent
   - Monitor performance

---

**Status:** ⏳ Waiting for Docker Desktop / PostgreSQL  
**Blocker:** Database not running  
**Solution:** Start Docker Desktop and run `docker-compose up -d postgres`

---

**Ready to test as soon as database is available!** 🚀
