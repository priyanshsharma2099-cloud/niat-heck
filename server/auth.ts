import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'cluey_cart_jwt_super_secret_key_development_2026';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Development bypass if running without token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV !== 'production') {
      req.userId = 'demo-user-dev';
      req.userEmail = 'merchant@clueycart.com';
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized. Bearer token required.' });
  }

  const token = authHeader.split(' ')[1];

  // 1. Try Supabase Auth verification
  if (supabaseAdmin) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (user && !error) {
        req.userId = user.id;
        req.userEmail = user.email;
        return next();
      }
    } catch {
      // Fall through to custom JWT verification
    }
  }

  // 2. Try Application JWT verification
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && (decoded.userId || decoded.sub)) {
      req.userId = decoded.userId || decoded.sub;
      req.userEmail = decoded.email;
      return next();
    }
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      req.userId = 'demo-user-dev';
      req.userEmail = 'merchant@clueycart.com';
      return next();
    }
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  return res.status(401).json({ error: 'Authentication failed.' });
}
