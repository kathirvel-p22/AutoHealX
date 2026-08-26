// Global Express Request augmentation for AutoHealX custom properties

declare global {
  namespace Express {
    interface Request {
      // Authenticated user from JWT (human/API user)
      user?: {
        userId: string;
        organizationId: string;
        email: string;
        roleId: string;
      };
      
      // Authenticated agent from API key/token
      agent?: {
        id: string;
        organizationId: string;
        name?: string;
        hostname?: string;
      };
      
      // Organization ID for tenant isolation
      organizationId?: string;
    }
  }
}

export {};
