import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to verify Supabase JWT token and attach user to request
 */
export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.warn('Authentication failed', { error: error?.message });
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Get user profile from public.users table
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      logger.warn('User profile not found', { userId: user.id });
      res.status(401).json({ error: 'User profile not found' });
      return;
    }

    // Attach user to request
    req.user = {
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role || 'user'
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Optional middleware - doesn't fail if no auth, but attaches user if present
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      const { data: userProfile } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('id', user.id)
        .single();

      if (userProfile) {
        req.user = {
          id: userProfile.id,
          email: userProfile.email,
          role: userProfile.role || 'user'
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
}

/**
 * Middleware to check if user has admin role
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

