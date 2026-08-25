# Phase 1 Verification Checklist

Use this checklist to verify that Phase 1 implementation is working correctly.

## Prerequisites

- [ ] Docker and Docker Compose installed
- [ ] `.env` file created from `.env.example` with valid credentials
- [ ] All services started: `docker-compose up -d`

## 1. Infrastructure Verification

### PostgreSQL Database

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check health
docker exec -it autohealx-postgres pg_isready -U postgres

# Connect to database
docker exec -it autohealx-postgres psql -U postgres -d autohealx -c "\dt"
```

**Expected:** 9 tables listed (organizations, users, roles, organization_members, projects, services, incidents, incident_events, audit_logs)

- [ ] PostgreSQL container is running
- [ ] Database is accepting connections
- [ ] All 9 tables exist

### Backend Service

```bash
# Check backend is running
docker ps | grep autohealx-backend

# Check logs
docker logs autohealx-backend

# Health check
curl http://localhost:4000/health

# Readiness check (includes DB)
curl http://localhost:4000/ready
```

**Expected:** Both endpoints return 200 OK with JSON response

- [ ] Backend container is running
- [ ] No errors in logs
- [ ] /health returns 200
- [ ] /ready returns 200 with database: connected

## 2. Authentication Testing

### User Registration

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "displayName": "Test User",
    "organizationName": "Test Organization"
  }'
```

**Expected:** 201 Created with user object and tokens

- [ ] Registration succeeds
- [ ] Returns accessToken and refreshToken
- [ ] Returns user with id, email, displayName, organizationId

### Save Token for Later Tests

```bash
# Extract and save access token
export ACCESS_TOKEN="paste_access_token_here"
```

### User Login

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

**Expected:** 200 OK with user, tokens, and role

- [ ] Login succeeds
- [ ] Returns tokens
- [ ] Role is "OWNER" (first user in org)

### Get Current User

```bash
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** 200 OK with user details

- [ ] Returns user information
- [ ] Matches registered user

### Token Refresh

```bash
# Save refresh token from registration/login
export REFRESH_TOKEN="paste_refresh_token_here"

curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}"
```

**Expected:** 200 OK with new tokens

- [ ] Returns new accessToken and refreshToken

### Change Password

```bash
curl -X POST http://localhost:4000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "currentPassword": "TestPass123",
    "newPassword": "NewTestPass123"
  }'
```

**Expected:** 200 OK with success message

- [ ] Password change succeeds
- [ ] Can login with new password

### Logout

```bash
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** 200 OK

- [ ] Logout succeeds

## 3. Authorization (RBAC) Testing

### Test Without Token (Should Fail)

```bash
curl http://localhost:4000/api/v1/incidents
```

**Expected:** 401 Unauthorized

- [ ] Returns error about missing authorization header

### Test With Invalid Token (Should Fail)

```bash
curl http://localhost:4000/api/v1/incidents \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected:** 401 Unauthorized

- [ ] Returns error about invalid token

### Test With Valid Token (Should Succeed)

```bash
curl http://localhost:4000/api/v1/incidents \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** 200 OK with empty incidents array

- [ ] Returns successful response
- [ ] User has permission to view incidents

## 4. Tenant Isolation Testing

### Create Second Organization

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user2@example.com",
    "password": "TestPass123",
    "displayName": "User Two",
    "organizationName": "Organization Two"
  }'

# Save the second user's token
export ACCESS_TOKEN_2="paste_second_user_token_here"
```

### Create Incident as First User

```bash
curl -X POST http://localhost:4000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Test Incident",
    "description": "This is a test incident",
    "severity": "high",
    "detected_at": "2026-08-25T10:00:00Z"
  }'

# Save the incident ID
export INCIDENT_ID="paste_incident_id_here"
```

**Expected:** 201 Created with incident

- [ ] Incident created successfully
- [ ] Has auto-generated incident_number (INC-YYYYMMDD-XXXX)
- [ ] Status is "detected"

### Try to Access as Second User (Should Fail)

```bash
curl http://localhost:4000/api/v1/incidents/$INCIDENT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN_2"
```

**Expected:** 404 Not Found (tenant isolation prevents access)

- [ ] Second user cannot see first user's incident
- [ ] Tenant isolation is working

## 5. Incident Management Testing

### List Incidents

```bash
curl http://localhost:4000/api/v1/incidents \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** 200 OK with array of incidents

- [ ] Returns incidents for current organization only
- [ ] Includes pagination info

### Get Incident Details

```bash
curl http://localhost:4000/api/v1/incidents/$INCIDENT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** 200 OK with incident details

- [ ] Returns full incident details

### Update Incident Status

```bash
curl -X PUT http://localhost:4000/api/v1/incidents/$INCIDENT_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "status": "investigating"
  }'
```

**Expected:** 200 OK with updated incident

- [ ] Status changed to "investigating"
- [ ] acknowledged_at timestamp set

### Try Invalid Status Transition (Should Fail)

```bash
curl -X PUT http://localhost:4000/api/v1/incidents/$INCIDENT_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "status": "resolved"
  }'
```

**Expected:** 400 Bad Request (invalid transition from investigating to resolved)

- [ ] State machine prevents invalid transition

### Add Event to Incident

```bash
curl -X POST http://localhost:4000/api/v1/incidents/$INCIDENT_ID/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "event_type": "comment",
    "description": "Investigating root cause",
    "metadata": {"source": "manual"}
  }'
```

**Expected:** 201 Created with event

- [ ] Event created successfully
- [ ] Includes actor_id (current user)

### Get Incident Timeline

```bash
curl http://localhost:4000/api/v1/incidents/$INCIDENT_ID/events \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** 200 OK with array of events

- [ ] Returns all events in chronological order
- [ ] Includes initial "detected" event
- [ ] Includes status change events
- [ ] Includes manual comment event

## 6. Validation Testing

### Invalid Email Format

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "TestPass123",
    "displayName": "Test",
    "organizationName": "Test Org"
  }'
```

**Expected:** 400 Bad Request with validation errors

- [ ] Returns validation error
- [ ] Mentions email format

### Weak Password

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weak@example.com",
    "password": "123",
    "displayName": "Test",
    "organizationName": "Test Org"
  }'
```

**Expected:** 400 Bad Request with validation errors

- [ ] Returns validation error
- [ ] Mentions password requirements

### Missing Required Field

```bash
curl -X POST http://localhost:4000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "description": "Missing title"
  }'
```

**Expected:** 400 or 500 with error (missing required field)

- [ ] Returns error about missing field

## 7. Rate Limiting Testing

```bash
# Run this script to test rate limiting
for i in {1..110}; do
  curl -s http://localhost:4000/health > /dev/null
  echo "Request $i"
done
```

**Expected:** After ~100 requests, should get 429 Too Many Requests

- [ ] Rate limiting activates after configured threshold
- [ ] Returns 429 status code

## 8. Database Verification

### Check Tables Exist

```bash
docker exec -it autohealx-postgres psql -U postgres -d autohealx -c "\dt"
```

**Expected:** Lists all 9 tables

- [ ] organizations
- [ ] users
- [ ] roles
- [ ] organization_members
- [ ] projects
- [ ] services
- [ ] incidents
- [ ] incident_events
- [ ] audit_logs

### Check Roles Seeded

```bash
docker exec -it autohealx-postgres psql -U postgres -d autohealx \
  -c "SELECT name FROM roles ORDER BY name;"
```

**Expected:** 4 roles

- [ ] ADMIN
- [ ] OPERATOR
- [ ] OWNER
- [ ] VIEWER

### Check User Created

```bash
docker exec -it autohealx-postgres psql -U postgres -d autohealx \
  -c "SELECT email, display_name FROM users;"
```

**Expected:** Shows registered users

- [ ] test@example.com exists
- [ ] user2@example.com exists

### Check Password Hashed

```bash
docker exec -it autohealx-postgres psql -U postgres -d autohealx \
  -c "SELECT email, substring(password_hash, 1, 7) as hash_prefix FROM users;"
```

**Expected:** Hash starts with "$2b$12$" (bcrypt)

- [ ] Passwords are hashed, not plaintext
- [ ] Uses bcrypt with 12 rounds

### Check Incident Number Generator

```bash
docker exec -it autohealx-postgres psql -U postgres -d autohealx \
  -c "SELECT generate_incident_number();"
```

**Expected:** Returns INC-YYYYMMDD-XXXX format

- [ ] Function exists and works
- [ ] Format matches INC-YYYYMMDD-XXXX

## 9. Security Verification

### Check CORS Headers

```bash
curl -I http://localhost:4000/health \
  -H "Origin: http://evil-site.com"
```

**Expected:** No Access-Control-Allow-Origin header (blocked)

- [ ] CORS blocks unauthorized origins

### Check Security Headers

```bash
curl -I http://localhost:4000/health
```

**Expected:** Security headers present (X-Content-Type-Options, etc.)

- [ ] Helmet headers present

### Check No Secrets in Logs

```bash
docker logs autohealx-backend | grep -i password
docker logs autohealx-backend | grep -i secret
docker logs autohealx-backend | grep -i token
```

**Expected:** No password/secret values in logs

- [ ] Logs don't contain secrets

## 10. Error Handling Verification

### 404 Not Found

```bash
curl http://localhost:4000/api/v1/nonexistent
```

**Expected:** 404 with structured error response

- [ ] Returns 404 status
- [ ] Includes error message

### 500 Server Error Handling

```bash
# Try to create incident with malformed data
curl -X POST http://localhost:4000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "severity": "invalid_severity_value"
  }'
```

**Expected:** 400 or 500 with error message

- [ ] Doesn't crash server
- [ ] Returns structured error
- [ ] Logged appropriately

## Summary Checklist

### Core Functionality
- [ ] PostgreSQL running and accessible
- [ ] Backend API starts successfully
- [ ] Health checks pass
- [ ] User registration works
- [ ] User login works
- [ ] JWT authentication works
- [ ] Token refresh works
- [ ] Incident CRUD works
- [ ] Incident state machine works
- [ ] Incident events timeline works

### Security
- [ ] Passwords are hashed (bcrypt)
- [ ] JWT tokens are validated
- [ ] RBAC authorization works
- [ ] Tenant isolation enforced
- [ ] Rate limiting works
- [ ] CORS configured
- [ ] Security headers present
- [ ] No secrets in logs
- [ ] Input validation works

### Database
- [ ] All tables created
- [ ] Indexes exist
- [ ] Foreign keys work
- [ ] Default roles seeded
- [ ] Triggers work (updated_at)
- [ ] Functions work (incident number)

### Quality
- [ ] No crashes or unhandled errors
- [ ] Structured error responses
- [ ] Logging works
- [ ] Request IDs for tracing
- [ ] 404 handling works
- [ ] Validation error messages clear

---

## Pass Criteria

**Minimum to Pass Phase 1:**
- ✅ All "Core Functionality" items checked
- ✅ All "Security" items checked
- ✅ All "Database" items checked
- ✅ At least 90% of "Quality" items checked

**If any critical items fail:**
1. Check logs: `docker logs autohealx-backend`
2. Check database: `docker exec -it autohealx-postgres psql -U postgres -d autohealx`
3. Verify environment variables in `.env`
4. Review `docs/PHASE_1_COMPLETE.md` for troubleshooting

---

**Phase 1 Verification Complete?**

If all critical items pass, Phase 1 is successfully implemented and ready for Phase 2.

Next: Proceed to Phase 2 (Agent Integration) or add optional enhancements (Projects API, Services API, tests, OpenAPI docs).
