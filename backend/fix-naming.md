# TypeScript Naming Convention Fixes Required

## Issue
Models use snake_case (Sequelize convention) but services/controllers use camelCase.

## Strategy
Fix services and controllers to use snake_case when accessing model properties.

## Changes Needed

### Agent Model Properties
- `organizationId` → `organization_id`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `lastHeartbeat` → `last_heartbeat_at`

### Agent Status Values
- Model only supports: 'active' | 'inactive' | 'suspended'
- Services try to use: 'pending' | 'revoked'
- **Fix**: Add these to model or change service logic

### AgentCredential Properties
- `agentId` → `agent_id`
- `apiKeyHash` → `api_key_hash`
- `expiresAt` → `expires_at`
- `revokedAt` → `revoked_at`
- `lastUsedAt` → `last_used_at`

### AgentHeartbeat Properties  
- Need to verify actual property names in model

### TelemetryEvent Properties
- `agentId` → `agent_id`
- `organizationId` → `organization_id`
- `eventType` → `event_type`
- `createdAt` → `created_at`

### DetectionResult Properties
- `agentId` → `agent_id`
- `organizationId` → `organization_id`
- `detectionType` → `detection_type`
- `detectedAt` → `detected_at`
- `createdAt` → `created_at`
- `suggestedAction` → `suggested_action`

## Files to Fix
1. src/controllers/agentController.ts (16 errors)
2. src/controllers/telemetryController.ts (13 errors)
3. src/services/agentService.ts (19 errors)
4. src/services/telemetryService.ts (17 errors)
5. src/middleware/authenticateAgent.ts (2 errors)

Total: 67 errors
