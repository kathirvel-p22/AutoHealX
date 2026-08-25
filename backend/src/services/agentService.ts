import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Agent } from '../models/Agent';
import { AgentCredential } from '../models/AgentCredential';
import { AgentHeartbeat } from '../models/AgentHeartbeat';
import { serverConfig } from '../config/server';
import { AppError } from '../errors/AppError';
import { logger } from '../logging/logger';

// Constants
const BCRYPT_ROUNDS = 12;
const API_KEY_LENGTH = 48;
const AGENT_JWT_EXPIRY = '1h'; // Agent tokens expire in 1 hour

// Interface for agent registration data
export interface AgentRegistrationData {
  organizationId: string;
  name: string;
  hostname: string;
  platform: string;
  version: string;
  capabilities?: string[];
  metadata?: Record<string, any>;
}

// Interface for agent token payload
export interface AgentTokenPayload {
  agentId: string;
  organizationId: string;
  type: 'agent';
}

/**
 * Generate a secure random API key
 */
function generateApiKey(): string {
  return crypto.randomBytes(API_KEY_LENGTH).toString('base64url');
}

/**
 * Hash an API key using bcrypt
 */
async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, BCRYPT_ROUNDS);
}

/**
 * Verify an API key against a hash
 */
async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}

/**
 * Register a new agent
 * Returns the agent record and plaintext API key (shown only once)
 */
export async function registerAgent(data: AgentRegistrationData): Promise<{ agent: Agent; apiKey: string }> {
  logger.info(`Registering new agent: ${data.name} (${data.hostname})`);

  // Create agent record
  const agent = await Agent.create({
    organizationId: data.organizationId,
    name: data.name,
    hostname: data.hostname,
    platform: data.platform,
    version: data.version,
    capabilities: data.capabilities || [],
    status: 'pending',
    metadata: data.metadata || {},
  });

  // Generate API key
  const apiKey = generateApiKey();
  const apiKeyHash = await hashApiKey(apiKey);

  // Calculate expiry (1 year from now)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  // Create credential record
  await AgentCredential.create({
    agentId: agent.id,
    apiKeyHash,
    name: 'default',
    expiresAt,
  });

  logger.info(`Agent registered successfully: ${agent.id}`);

  // Return agent and plaintext API key (ONLY TIME IT'S RETURNED)
  return {
    agent,
    apiKey,
  };
}

/**
 * Authenticate agent with API key and return JWT token
 */
export async function authenticateAgent(apiKey: string): Promise<{ token: string; agent: Agent }> {
  // Find all non-revoked credentials (we need to check all since we don't know which agent)
  const credentials = await AgentCredential.findAll({
    where: {
      revokedAt: null,
    },
    include: [
      {
        model: Agent,
        as: 'agent',
        where: {
          status: 'active',
        },
      },
    ],
  });

  // Try to match the API key
  for (const credential of credentials) {
    const isValid = await verifyApiKey(apiKey, credential.apiKeyHash);

    if (isValid) {
      // Check expiry
      if (credential.expiresAt && credential.expiresAt < new Date()) {
        throw new AppError('API key expired', 401);
      }

      // Update last used timestamp
      await credential.update({ lastUsedAt: new Date() });

      const agent = credential.agent as Agent;

      // Generate JWT token
      const payload: AgentTokenPayload = {
        agentId: agent.id,
        organizationId: agent.organizationId,
        type: 'agent',
      };

      const token = jwt.sign(payload, serverConfig.jwtSecret, {
        expiresIn: AGENT_JWT_EXPIRY,
      });

      logger.info(`Agent authenticated: ${agent.id} (${agent.name})`);

      return { token, agent };
    }
  }

  // No matching credential found
  throw new AppError('Invalid API key', 401);
}

/**
 * Verify agent JWT token
 */
export async function verifyAgentToken(token: string): Promise<AgentTokenPayload> {
  try {
    const payload = jwt.verify(token, serverConfig.jwtSecret) as AgentTokenPayload;

    if (payload.type !== 'agent') {
      throw new AppError('Invalid token type', 401);
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401);
    }
    throw new AppError('Invalid token', 401);
  }
}

/**
 * Get agent by ID
 */
export async function getAgentById(agentId: string): Promise<Agent> {
  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  return agent;
}

/**
 * List agents for an organization
 */
export async function listAgents(organizationId: string, filters?: {
  status?: string;
  platform?: string;
}): Promise<Agent[]> {
  const where: any = { organizationId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.platform) {
    where.platform = filters.platform;
  }

  return Agent.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });
}

/**
 * Update agent status
 */
export async function updateAgentStatus(
  agentId: string,
  status: 'pending' | 'active' | 'inactive' | 'revoked'
): Promise<Agent> {
  const agent = await getAgentById(agentId);

  await agent.update({ status });

  logger.info(`Agent status updated: ${agentId} -> ${status}`);

  return agent;
}

/**
 * Revoke agent (mark as revoked and revoke all credentials)
 */
export async function revokeAgent(agentId: string): Promise<void> {
  const agent = await getAgentById(agentId);

  // Mark agent as revoked
  await agent.update({ status: 'revoked' });

  // Revoke all credentials
  await AgentCredential.update(
    { revokedAt: new Date() },
    { where: { agentId } }
  );

  logger.warn(`Agent revoked: ${agentId} (${agent.name})`);
}

/**
 * Rotate agent API key (revoke old, create new)
 */
export async function rotateApiKey(agentId: string, oldKeyName: string = 'default'): Promise<string> {
  const agent = await getAgentById(agentId);

  // Revoke old credential
  await AgentCredential.update(
    { revokedAt: new Date() },
    { where: { agentId, name: oldKeyName } }
  );

  // Generate new API key
  const apiKey = generateApiKey();
  const apiKeyHash = await hashApiKey(apiKey);

  // Calculate expiry (1 year from now)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  // Create new credential
  await AgentCredential.create({
    agentId,
    apiKeyHash,
    name: `${oldKeyName}-rotated-${Date.now()}`,
    expiresAt,
  });

  logger.info(`API key rotated for agent: ${agentId}`);

  return apiKey;
}

/**
 * Record agent heartbeat
 */
export async function recordHeartbeat(
  agentId: string,
  data: {
    status: 'online' | 'offline' | 'degraded';
    cpuUsage?: number;
    memoryUsage?: number;
    processCount?: number;
    metadata?: Record<string, any>;
  }
): Promise<AgentHeartbeat> {
  const heartbeat = await AgentHeartbeat.create({
    agentId,
    status: data.status,
    cpuUsage: data.cpuUsage,
    memoryUsage: data.memoryUsage,
    processCount: data.processCount,
    metadata: data.metadata || {},
  });

  // Note: Database trigger will automatically update agent.lastHeartbeat

  return heartbeat;
}

/**
 * Check if agent is online (heartbeat within last 2 minutes)
 */
export async function isAgentOnline(agentId: string): Promise<boolean> {
  const agent = await getAgentById(agentId);

  if (!agent.lastHeartbeat) {
    return false;
  }

  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  return agent.lastHeartbeat >= twoMinutesAgo;
}

/**
 * Get agent health history
 */
export async function getAgentHealthHistory(
  agentId: string,
  limit: number = 100
): Promise<AgentHeartbeat[]> {
  return AgentHeartbeat.findAll({
    where: { agentId },
    order: [['createdAt', 'DESC']],
    limit,
  });
}

export default {
  registerAgent,
  authenticateAgent,
  verifyAgentToken,
  getAgentById,
  listAgents,
  updateAgentStatus,
  revokeAgent,
  rotateApiKey,
  recordHeartbeat,
  isAgentOnline,
  getAgentHealthHistory,
};
