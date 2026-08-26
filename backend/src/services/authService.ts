import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Organization, OrganizationMember, Role } from '../models';
import { serverConfig } from '../config/server';
import { AppError } from '../errors/AppError';
import logger from '../logging/logger';

export interface TokenPayload {
  userId: string;
  organizationId: string;
  email: string;
  roleId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  organizationName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Register a new user and create their organization
   */
  static async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Validate password strength
      if (data.password.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: data.email } });
      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      // Hash password with bcrypt (12 rounds)
      const passwordHash = await bcrypt.hash(data.password, serverConfig.security.bcryptRounds);

      // Create organization
      const organization = await Organization.create({
        name: data.organizationName,
        status: 'active'
      });

      // Create user
      const user = await User.create({
        organization_id: organization.id,
        email: data.email,
        password_hash: passwordHash,
        display_name: data.displayName,
        status: 'active'
      });

      // Get OWNER role
      const ownerRole = await Role.findOne({ where: { name: 'OWNER' } });
      if (!ownerRole) {
        throw new AppError('OWNER role not found - database not properly initialized', 500);
      }

      // Add user to organization as OWNER
      await OrganizationMember.create({
        organization_id: organization.id,
        user_id: user.id,
        role_id: ownerRole.id
      });

      // Generate tokens
      const tokens = this.generateTokens({
        userId: user.id,
        organizationId: organization.id,
        email: user.email,
        roleId: ownerRole.id
      });

      logger.info(`User registered: ${user.email} (org: ${organization.name})`);

      return { user, tokens };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Authenticate user and return tokens
   */
  static async login(data: LoginData): Promise<{ user: User; tokens: AuthTokens; role: Role }> {
    try {
      // Find user
      const user = await User.findOne({ 
        where: { email: data.email },
        include: [{ model: Organization, as: 'organization' }]
      });

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check user status
      if (user.status !== 'active') {
        throw new AppError('User account is not active', 403);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
      if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401);
      }

      // Get user's role in organization
      const member = await OrganizationMember.findOne({
        where: {
          user_id: user.id,
          organization_id: user.organization_id
        },
        include: [{ model: Role, as: 'role' }]
      });

      if (!member || !(member as any).role) {
        throw new AppError('User role not found', 500);
      }

      // Update last login
      await user.update({ last_login_at: new Date() });

      // Generate tokens
      const tokens = this.generateTokens({
        userId: user.id,
        organizationId: user.organization_id,
        email: user.email,
        roleId: member.role_id
      });

      logger.info(`User logged in: ${user.email}`);

      return { user, tokens, role: (member as any).role };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  static generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, serverConfig.jwt.secret as string, {
      expiresIn: serverConfig.jwt.expiry as string
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { userId: payload.userId },
      serverConfig.jwt.refreshSecret as string,
      { expiresIn: serverConfig.jwt.refreshExpiry as string } as jwt.SignOptions
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: serverConfig.jwt.expiry
    };
  }

  /**
   * Verify and decode access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, serverConfig.jwt.secret) as TokenPayload;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }

  /**
   * Verify refresh token and generate new access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, serverConfig.jwt.refreshSecret) as { userId: string };

      // Get user with role
      const user = await User.findByPk(decoded.userId);
      if (!user || user.status !== 'active') {
        throw new AppError('Invalid refresh token', 401);
      }

      const member = await OrganizationMember.findOne({
        where: {
          user_id: user.id,
          organization_id: user.organization_id
        }
      });

      if (!member) {
        throw new AppError('User membership not found', 500);
      }

      // Generate new tokens
      return this.generateTokens({
        userId: user.id,
        organizationId: user.organization_id,
        email: user.email,
        roleId: member.role_id
      });
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    // Hash and update
    const newPasswordHash = await bcrypt.hash(newPassword, serverConfig.security.bcryptRounds);
    await user.update({ password_hash: newPasswordHash });

    logger.info(`Password changed for user: ${user.email}`);
  }
}
