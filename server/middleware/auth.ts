import { Request, Response, NextFunction } from 'express';
import { verifyCryptoToken } from '../db/database.js';
import { CoreUser } from '../db/types.js';
import { repositories } from '../repositories/index.js';

export interface AuthenticatedRequest extends Request {
  user?: CoreUser;
  userId?: string;
  userRole?: string;
  isAdmin?: boolean;
}

/**
 * Extracts and verifies bearer token from incoming request.
 * Populates req.user, req.userId, req.userRole, req.isAdmin strictly on the request object.
 * Reads user and role records exclusively from the configured repository adapter.
 */
export async function authenticateRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
    let token: string | undefined;

    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else {
        token = authHeader.trim();
      }
    }

    if (token) {
      const verified = verifyCryptoToken(token);
      if (verified.valid && verified.payload && verified.payload.sub) {
        const user = await repositories.users.getById(verified.payload.sub);
        if (user) {
          req.user = user;
          req.userId = user.id;
          req.userRole = user.role_id;
          const role = await repositories.roles.getRoleById(user.role_id);
          req.isAdmin = (role?.is_admin ?? user.role_id === 'admin') && user.is_active;
          return next();
        }
      }
    }

    // If no valid token provided:
    // In single-user mode, default to the main active admin user if available
    const multiUserSetting = await repositories.settings.get('multi_user_enabled');
    const multiUserEnabled = multiUserSetting !== undefined ? multiUserSetting : true;
    if (!multiUserEnabled) {
      const allUsers = await repositories.users.getAll();
      const defaultUser =
        allUsers.find((u) => u.is_active && u.role_id === 'admin') ||
        allUsers[0];
      if (defaultUser) {
        req.user = defaultUser;
        req.userId = defaultUser.id;
        req.userRole = defaultUser.role_id;
        req.isAdmin = true;
        return next();
      }
    }

    // Otherwise unauthenticated request
    req.user = undefined;
    req.userId = undefined;
    req.userRole = undefined;
    req.isAdmin = false;
    return next();
  } catch (err) {
    console.error('[LifeHub Auth Middleware] Error authenticating request:', err);
    req.user = undefined;
    req.userId = undefined;
    req.userRole = undefined;
    req.isAdmin = false;
    return next();
  }
}

/**
 * Guard middleware ensuring request has a valid authenticated user.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !req.userId) {
    res.status(401).json({
      error: 'Authentication required. Please provide a valid Bearer token.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }
  if (!req.user.is_active) {
    res.status(403).json({
      error: 'User account is disabled.',
      code: 'ACCOUNT_DISABLED',
    });
    return;
  }
  next();
}

/**
 * Guard middleware ensuring request is made by an administrator.
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !req.userId) {
    res.status(401).json({
      error: 'Authentication required.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }
  if (!req.isAdmin) {
    res.status(403).json({
      error: 'Administrator privileges required.',
      code: 'FORBIDDEN',
    });
    return;
  }
  next();
}
