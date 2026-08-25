# AutoHealX Development Guide

**For developers continuing Phase 1 or starting Phase 2**

## 🎯 Quick Orientation

### What is AutoHealX?
AutoHealX is an intelligent incident management platform with rule-based detection and human-approved remediation workflows.

### Current Status (Phase 1 Complete)
- ✅ Production-ready backend API (Express + TypeScript)
- ✅ PostgreSQL database with full schema
- ✅ JWT authentication + RBAC authorization
- ✅ Multi-tenant architecture
- ✅ Complete incident management API
- ✅ Projects and Services management API
- ⏳ Frontend integration (Phase 3)
- ⏳ Agent WebSocket communication (Phase 2)

## 📚 Essential Reading

**Start here:**
1. `README.md` - Project overview
2. `QUICK_START.md` - Get running in 5 minutes
3. `backend/README.md` - API documentation
4. `docs/PHASE_1_ARCHITECTURE.md` - System design

**Architecture context:**
5. `docs/ARCHITECTURE_DECISIONS.md` - Key decisions
6. `docs/IMPLEMENTATION_PLAN.md` - 11-phase roadmap
7. `docs/REPOSITORY_ASSESSMENT.md` - Initial assessment

## 🚀 Getting Started

### Prerequisites
```bash
# Required
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Git

# Recommended
- VS Code with TypeScript extension
- Postman or curl for API testing
```

### Initial Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd AutoHealX-main

# 2. Install backend dependencies
cd backend
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env - Set DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET

# 4. Start PostgreSQL
docker-compose up postgres -d

# 5. Run migrations
npm run migrate

# 6. Start backend
npm run dev
# Backend runs on http://localhost:4000

# 7. Test it works
curl http://localhost:4000/health
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration (server, database)
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic
│   ├── models/          # Database models (Sequelize)
│   ├── routes/          # API route definitions
│   ├── middleware/      # Express middleware
│   ├── validators/      # Request validation rules
│   ├── errors/          # Custom error classes
│   ├── logging/         # Winston logger
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server startup
├── database/
│   ├── migrations/      # SQL migration scripts
│   └── migrate.ts       # Migration runner
└── tests/               # Tests (not yet implemented)
```

## 🔧 Development Workflow

### 1. Create a New Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow the existing patterns:

**Adding a new API endpoint:**
1. Create/update controller in `src/controllers/`
2. Create/update route in `src/routes/`
3. Add validation in `src/validators/`
4. Update `src/app.ts` to register route
5. Test with curl or Postman

**Adding a new model:**
1. Create model in `src/models/`
2. Add associations in `src/models/index.ts`
3. Create migration in `database/migrations/`
4. Run migration: `npm run migrate`

### 3. Test Your Changes

```bash
# Start backend
npm run dev

# Test endpoint
curl -X POST http://localhost:4000/api/v1/your-endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"key": "value"}'
```

### 4. Check Code Quality

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Type check
npm run type-check
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new endpoint for X"
```

## 🎨 Code Style Guide

### TypeScript
- Use strict mode (already configured)
- Define interfaces for all data structures
- Use async/await (not .then())
- Prefer const over let
- Use meaningful variable names

### Example Controller Pattern

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { YourModel } from '../models';
import { AppError } from '../errors/AppError';

export class YourController {
  /**
   * GET /api/v1/your-resource
   */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = res.locals.organizationId;
      const { limit = '50', offset = '0' } = req.query;

      const items = await YourModel.findAndCountAll({
        where: { organization_id: organizationId },
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: {
          items: items.rows,
          pagination: {
            total: items.count,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### Example Route Pattern

```typescript
import { Router } from 'express';
import { YourController } from '../controllers/yourController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { injectOrganizationId } from '../middleware/tenantIsolation';
import { validateRequest } from '../middleware/validateRequest';
import { yourValidation } from '../validators/yourValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(injectOrganizationId);

// GET /api/v1/your-resource - List
router.get(
  '/',
  authorize('view_resource'),
  YourController.list
);

// POST /api/v1/your-resource - Create
router.post(
  '/',
  authorize('manage_resource'),
  validateRequest(yourValidation),
  YourController.create
);

export default router;
```

## 🔒 Security Best Practices

### ALWAYS

✅ **Filter by organization_id**
```typescript
// Good
const resource = await Model.findOne({
  where: { 
    id: resourceId,
    organization_id: organizationId  // ← REQUIRED
  }
});

// Bad - Security vulnerability!
const resource = await Model.findByPk(resourceId);
```

✅ **Use AppError for operational errors**
```typescript
if (!resource) {
  throw new AppError('Resource not found', 404);
}
```

✅ **Validate all inputs**
```typescript
import { body } from 'express-validator';

export const validation = [
  body('email').isEmail(),
  body('name').trim().isLength({ min: 2, max: 255 })
];
```

✅ **Never log secrets**
```typescript
// Good
logger.info(`User logged in: ${user.email}`);

// Bad - Security vulnerability!
logger.info(`Password: ${password}`);
```

### NEVER

❌ Don't skip tenant isolation
❌ Don't log passwords or tokens
❌ Don't use `SELECT *` without org filter
❌ Don't trust user input without validation
❌ Don't commit secrets to repository

## 🧪 Testing (Not Yet Implemented)

When adding tests:

```typescript
// tests/unit/authService.test.ts
import { AuthService } from '../../src/services/authService';

describe('AuthService', () => {
  describe('register', () => {
    it('should hash password with bcrypt', async () => {
      // Test implementation
    });

    it('should reject weak passwords', async () => {
      // Test implementation
    });
  });
});
```

## 📝 Common Tasks

### Add a New Permission

1. Update role permissions in migration:
```sql
UPDATE roles 
SET permissions = permissions || '["new_permission"]'::jsonb
WHERE name = 'ADMIN';
```

2. Use in route:
```typescript
router.get('/', authorize('new_permission'), Controller.method);
```

### Add a New Role

1. Add to database migration:
```sql
INSERT INTO roles (id, name, permissions) VALUES
  (gen_random_uuid(), 'NEW_ROLE', '["permission1", "permission2"]'::jsonb);
```

2. Update Role enum if needed

### Add a New Status to Incident

1. Update database constraint:
```sql
ALTER TABLE incidents DROP CONSTRAINT incidents_status_check;
ALTER TABLE incidents ADD CONSTRAINT incidents_status_check 
  CHECK (status IN ('detected', 'investigating', ..., 'new_status'));
```

2. Update state machine in IncidentController:
```typescript
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  // ... existing transitions
  new_status: ['next_status']
};
```

3. Update TypeScript type in Model

### Debug Database Issues

```bash
# Connect to PostgreSQL
docker exec -it autohealx-postgres psql -U postgres -d autohealx

# List tables
\dt

# Describe table
\d incidents

# Query data
SELECT * FROM users;

# Exit
\q
```

### View Logs

```bash
# Backend logs
docker logs -f autohealx-backend

# PostgreSQL logs
docker logs -f autohealx-postgres

# All logs
docker-compose logs -f
```

## 🚦 API Testing with curl

### Register User
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "displayName": "Test User",
    "organizationName": "Test Org"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Use Token
```bash
TOKEN="your_access_token_here"

curl http://localhost:4000/api/v1/incidents \
  -H "Authorization: Bearer $TOKEN"
```

## 🐛 Troubleshooting

### Backend won't start

**Error:** "Cannot connect to database"
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs autohealx-postgres

# Restart PostgreSQL
docker-compose restart postgres
```

**Error:** "JWT_SECRET must be at least 32 characters"
```bash
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
JWT_SECRET=<generated_secret>
```

### Migration fails

```bash
# Check migration file syntax
cat backend/database/migrations/001_initial_schema.sql

# Drop and recreate database (⚠️ deletes all data)
docker exec -it autohealx-postgres psql -U postgres -c "DROP DATABASE autohealx"
docker exec -it autohealx-postgres psql -U postgres -c "CREATE DATABASE autohealx"

# Re-run migration
cd backend && npm run migrate
```

### TypeScript errors

```bash
# Check for type errors
npm run type-check

# Common fix: Install types
npm install --save-dev @types/package-name
```

## 📦 Adding Dependencies

### Backend Package

```bash
cd backend

# Production dependency
npm install package-name

# Development dependency
npm install --save-dev @types/package-name
```

**Update Docker image after adding dependencies:**
```bash
docker-compose build autohealx-backend
```

## 🎯 Phase 2 Tasks (Next Steps)

### Agent Integration via WebSocket

1. **WebSocket Server**
   - Add socket.io to backend
   - Create WebSocket authentication
   - Handle agent connections

2. **Agent Registration**
   - Agent model and migration
   - Registration endpoint
   - Agent authentication tokens

3. **Metrics Collection**
   - Metrics model and API
   - Time-series data handling
   - Aggregation queries

4. **Health Reporting**
   - Service health updates
   - Status propagation
   - Alert generation

See `docs/IMPLEMENTATION_PLAN.md` for complete Phase 2 details.

## 📖 Key Concepts

### Multi-Tenancy
Every resource belongs to an organization. Always filter by `organization_id`.

### RBAC Roles
- **OWNER**: Full control
- **ADMIN**: Manage users/projects/services
- **OPERATOR**: Investigate incidents, approve remediation
- **VIEWER**: Read-only

### Incident State Machine
```
detected → investigating → identified → 
remediation_pending → remediating → resolved → closed
```

### JWT Tokens
- **Access Token**: 8 hours (short-lived)
- **Refresh Token**: 7 days (long-lived)
- Always validate on protected routes

## 🆘 Getting Help

1. **Check Documentation**
   - `README.md` - Overview
   - `backend/README.md` - API docs
   - `docs/` folder - Architecture

2. **Review Existing Code**
   - Look at similar controllers/routes
   - Follow established patterns

3. **Check Implementation Guide**
   - `docs/PHASE_1_COMPLETE.md` - Technical details

4. **Debug with Logs**
   - `docker logs autohealx-backend`
   - Check `backend/logs/` folder

## ✅ Pre-Commit Checklist

Before committing code:

- [ ] Code follows existing patterns
- [ ] Tenant isolation enforced (organization_id filtering)
- [ ] Input validation added
- [ ] Error handling implemented
- [ ] No secrets in code
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Tested locally
- [ ] Documentation updated if needed

## 🎓 Learning Resources

### TypeScript
- [Official TypeScript Docs](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Express.js
- [Official Express Guide](https://expressjs.com/en/guide/routing.html)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### Sequelize ORM
- [Sequelize Docs](https://sequelize.org/docs/v6/)
- [Model Associations](https://sequelize.org/docs/v6/core-concepts/assocs/)

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 🚀 Happy Coding!

Remember:
- Read the docs first
- Follow existing patterns
- Test thoroughly
- Never compromise on security
- Ask questions early

---

**For questions or issues, review the documentation in the `docs/` folder.**

**Good luck with Phase 2! 🎉**
