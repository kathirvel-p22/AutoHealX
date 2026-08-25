import { Request, Response } from 'express';
import * as agentService from '../services/agentService';
import { AppError } from '../errors/AppError';
import logger from '../logging/logger';

/**
 * POST /api/v1/agents/register
 * Register a new agent (requires admin authentication)
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId, name, hostname, platform, version, capabilities, metadata } = req.body;

    // Validate required fields
    if (!organizationId || !name || !hostname || !platform || !version) {
      throw new AppError('Missing required fields', 400);
    }

    // Register agent
    const { agent, apiKey } = await agentService.registerAgent({
      organizationId,
      name,
      hostname,
      platform,
      version,
      capabilities,
      metadata,
    });

    logger.info(`Agent registered: ${agent.id} by user ${req.user?.userId}`);

    // Return agent details and API key (ONLY TIME THE KEY IS RETURNED)
    res.status(201).json({
      agent: {
        id: agent.id,
        organizationId: agent.organizationId,
        name: agent.name,
        hostname: agent.hostname,
        platform: agent.platform,
        version: agent.version,
        capabilities: agent.capabilities,
        status: agent.status,
        createdAt: agent.createdAt,
      },
      apiKey, // ⚠️ CRITICAL: Store this securely, it won't be shown again
      message: 'Agent registered successfully. Store the API key securely - it cannot be retrieved later.',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Agent registration error:', error);
      res.status(500).json({ error: 'Failed to register agent' });
    }
  }
}

/**
 * POST /api/v1/agents/authenticate
 * Exchange API key for JWT token
 */
export async function authenticate(req: Request, res: Response): Promise<void> {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      throw new AppError('API key required', 400);
    }

    // Authenticate and get token
    const { token, agent } = await agentService.authenticateAgent(apiKey);

    res.json({
      token,
      expiresIn: '1h',
      agent: {
        id: agent.id,
        name: agent.name,
        organizationId: agent.organizationId,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Agent authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
}

/**
 * GET /api/v1/agents
 * List all agents in organization (requires admin auth)
 */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = req.params;
    const { status, platform } = req.query;

    const agents = await agentService.listAgents(organizationId, {
      status: status as string,
      platform: platform as string,
    });

    res.json({
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        hostname: agent.hostname,
        platform: agent.platform,
        version: agent.version,
        status: agent.status,
        lastHeartbeat: agent.lastHeartbeat,
        createdAt: agent.createdAt,
      })),
      total: agents.length,
    });
  } catch (error) {
    logger.error('List agents error:', error);
    res.status(500).json({ error: 'Failed to list agents' });
  }
}

/**
 * GET /api/v1/agents/:id
 * Get agent details (requires admin auth)
 */
export async function get(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const agent = await agentService.getAgentById(id);

    res.json({
      agent: {
        id: agent.id,
        organizationId: agent.organizationId,
        name: agent.name,
        hostname: agent.hostname,
        platform: agent.platform,
        version: agent.version,
        capabilities: agent.capabilities,
        status: agent.status,
        lastHeartbeat: agent.lastHeartbeat,
        metadata: agent.metadata,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Get agent error:', error);
      res.status(500).json({ error: 'Failed to get agent' });
    }
  }
}

/**
 * PATCH /api/v1/agents/:id/status
 * Update agent status (requires admin auth)
 */
export async function updateStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'active', 'inactive', 'revoked'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const agent = await agentService.updateAgentStatus(id, status);

    res.json({
      agent: {
        id: agent.id,
        status: agent.status,
        updatedAt: agent.updatedAt,
      },
      message: `Agent status updated to ${status}`,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Update agent status error:', error);
      res.status(500).json({ error: 'Failed to update agent status' });
    }
  }
}

/**
 * POST /api/v1/agents/:id/revoke
 * Revoke agent (requires admin auth)
 */
export async function revoke(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    await agentService.revokeAgent(id);

    res.json({
      message: 'Agent revoked successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Revoke agent error:', error);
      res.status(500).json({ error: 'Failed to revoke agent' });
    }
  }
}

/**
 * POST /api/v1/agents/:id/rotate-key
 * Rotate agent API key (requires admin auth)
 */
export async function rotateKey(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const newApiKey = await agentService.rotateApiKey(id);

    logger.info(`API key rotated for agent: ${id} by user ${req.user?.userId}`);

    res.json({
      apiKey: newApiKey,
      message: 'API key rotated successfully. Store the new key securely - it cannot be retrieved later.',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Rotate key error:', error);
      res.status(500).json({ error: 'Failed to rotate API key' });
    }
  }
}

/**
 * POST /api/v1/agents/heartbeat
 * Record agent heartbeat (requires agent auth)
 */
export async function heartbeat(req: Request, res: Response): Promise<void> {
  try {
    if (!req.agent) {
      throw new AppError('Agent not authenticated', 401);
    }

    const { status, cpuUsage, memoryUsage, processCount, metadata } = req.body;

    if (!status || !['online', 'offline', 'degraded'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    await agentService.recordHeartbeat(req.agent.id, {
      status,
      cpuUsage,
      memoryUsage,
      processCount,
      metadata,
    });

    res.json({
      message: 'Heartbeat recorded',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Heartbeat error:', error);
      res.status(500).json({ error: 'Failed to record heartbeat' });
    }
  }
}

/**
 * GET /api/v1/agents/:id/health
 * Get agent health history (requires admin auth)
 */
export async function getHealth(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const history = await agentService.getAgentHealthHistory(id, limit);
    const isOnline = await agentService.isAgentOnline(id);

    res.json({
      agentId: id,
      isOnline,
      history: history.map(h => ({
        status: h.status,
        cpuUsage: h.cpuUsage,
        memoryUsage: h.memoryUsage,
        processCount: h.processCount,
        timestamp: h.createdAt,
      })),
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Get health error:', error);
      res.status(500).json({ error: 'Failed to get agent health' });
    }
  }
}

export default {
  register,
  authenticate,
  list,
  get,
  updateStatus,
  revoke,
  rotateKey,
  heartbeat,
  getHealth,
};

