import request from 'supertest';
import app from '../src/app';
import { sequelize } from '../src/config/database';
import { Agent, AgentCredential, Organization, User, Role } from '../src/models';

describe('Agent Integration Tests', () => {
  let adminToken: string;
  let organizationId: string;
  let agentApiKey: string;
  let agentId: string;
  let agentToken: string;

  // Setup: Create organization, admin user, and get admin token
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create organization
    const org = await Organization.create({
      name: 'Test Organization',
      status: 'active',
    });
    organizationId = org.id;

    // Create admin role
    const adminRole = await Role.create({
      name: 'ADMIN',
      permissions: ['manage_agents', 'view_telemetry'],
    });

    // Create admin user
    const adminUser = await User.create({
      organizationId: org.id,
      email: 'admin@test.com',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5oi2AlP/K2zFG', // "password"
      displayName: 'Admin User',
      status: 'active',
    });

    // Get admin token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password',
      });

    adminToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/agents/register', () => {
    it('should register a new agent', async () => {
      const response = await request(app)
        .post('/api/v1/agents/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          organizationId,
          name: 'test-agent',
          hostname: 'test-server-01',
          platform: 'linux',
          version: '2.0.0',
          capabilities: ['docker', 'process_management'],
          metadata: {
            region: 'us-east-1',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.agent).toBeDefined();
      expect(response.body.agent.name).toBe('test-agent');
      expect(response.body.agent.hostname).toBe('test-server-01');
      expect(response.body.agent.status).toBe('pending');
      expect(response.body.apiKey).toBeDefined();
      expect(response.body.apiKey).toHaveLength(64); // Base64URL encoded 48 bytes

      // Store for later tests
      agentId = response.body.agent.id;
      agentApiKey = response.body.apiKey;
    });

    it('should reject registration without admin auth', async () => {
      const response = await request(app)
        .post('/api/v1/agents/register')
        .send({
          organizationId,
          name: 'test-agent-2',
          hostname: 'test-server-02',
          platform: 'linux',
          version: '2.0.0',
        });

      expect(response.status).toBe(401);
    });

    it('should reject registration with invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/agents/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          organizationId,
          name: 'test-agent-3',
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/agents/authenticate', () => {
    beforeAll(async () => {
      // Activate the agent
      await Agent.update({ status: 'active' }, { where: { id: agentId } });
    });

    it('should authenticate agent with API key', async () => {
      const response = await request(app)
        .post('/api/v1/agents/authenticate')
        .send({
          apiKey: agentApiKey,
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.expiresIn).toBe('1h');
      expect(response.body.agent).toBeDefined();
      expect(response.body.agent.id).toBe(agentId);

      // Store token for later tests
      agentToken = response.body.token;
    });

    it('should reject authentication with invalid API key', async () => {
      const response = await request(app)
        .post('/api/v1/agents/authenticate')
        .send({
          apiKey: 'invalid-api-key',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/agents/heartbeat', () => {
    it('should record heartbeat with agent auth', async () => {
      const response = await request(app)
        .post('/api/v1/agents/heartbeat')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          status: 'online',
          cpuUsage: 45.2,
          memoryUsage: 68.5,
          processCount: 142,
          metadata: {
            uptime: 3600,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Heartbeat recorded');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should reject heartbeat without agent auth', async () => {
      const response = await request(app)
        .post('/api/v1/agents/heartbeat')
        .send({
          status: 'online',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/telemetry', () => {
    it('should ingest telemetry with agent auth', async () => {
      const response = await request(app)
        .post('/api/v1/telemetry')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          eventType: 'METRIC',
          data: {
            cpu: 45.2,
            memory: 68.5,
            processCount: 142,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Telemetry ingested');
    });

    it('should reject telemetry without agent auth', async () => {
      const response = await request(app)
        .post('/api/v1/telemetry')
        .send({
          eventType: 'METRIC',
          data: { cpu: 45.2 },
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/telemetry/batch', () => {
    it('should ingest batch telemetry', async () => {
      const response = await request(app)
        .post('/api/v1/telemetry/batch')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          events: [
            {
              eventType: 'METRIC',
              data: { cpu: 45.2 },
            },
            {
              eventType: 'METRIC',
              data: { cpu: 46.1 },
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.count).toBe(2);
    });

    it('should reject batch with too many events', async () => {
      const events = Array(1001).fill({
        eventType: 'METRIC',
        data: { cpu: 45.2 },
      });

      const response = await request(app)
        .post('/api/v1/telemetry/batch')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ events });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/telemetry/detections', () => {
    it('should record detection', async () => {
      const response = await request(app)
        .post('/api/v1/telemetry/detections')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          detectionType: 'HIGH_CPU_USAGE',
          severity: 'high',
          confidence: 0.95,
          message: 'CPU usage exceeded 90%',
          suggestedAction: 'RESTART_SERVICE',
          metadata: {
            threshold: 90,
            currentValue: 95.2,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.detection).toBeDefined();
      expect(response.body.detection.detectionType).toBe('HIGH_CPU_USAGE');
      expect(response.body.detection.severity).toBe('high');
    });

    it('should reject detection with invalid confidence', async () => {
      const response = await request(app)
        .post('/api/v1/telemetry/detections')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          detectionType: 'HIGH_CPU_USAGE',
          severity: 'high',
          confidence: 1.5, // Invalid: > 1
          message: 'CPU usage exceeded 90%',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/agents/:id', () => {
    it('should get agent details with admin auth', async () => {
      const response = await request(app)
        .get(`/api/v1/agents/${agentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.agent).toBeDefined();
      expect(response.body.agent.id).toBe(agentId);
      expect(response.body.agent.name).toBe('test-agent');
    });

    it('should reject without admin auth', async () => {
      const response = await request(app).get(`/api/v1/agents/${agentId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/agents/:id/status', () => {
    it('should update agent status', async () => {
      const response = await request(app)
        .patch(`/api/v1/agents/${agentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'inactive',
        });

      expect(response.status).toBe(200);
      expect(response.body.agent.status).toBe('inactive');
    });
  });

  describe('POST /api/v1/agents/:id/revoke', () => {
    it('should revoke agent', async () => {
      const response = await request(app)
        .post(`/api/v1/agents/${agentId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Agent revoked successfully');

      // Verify agent is revoked
      const agent = await Agent.findByPk(agentId);
      expect(agent?.status).toBe('revoked');

      // Verify credentials are revoked
      const credentials = await AgentCredential.findAll({
        where: { agentId },
      });
      expect(credentials.every((c) => c.revokedAt !== null)).toBe(true);
    });

    it('should reject authentication with revoked agent', async () => {
      const response = await request(app)
        .post('/api/v1/agents/authenticate')
        .send({
          apiKey: agentApiKey,
        });

      expect(response.status).toBe(401);
    });
  });
});
