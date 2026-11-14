import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'cluey_cart_jwt_super_secret_key_development_2026';

const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// In-memory cache for profiles when external DB is in transition
const memoryUsers = new Map<string, any>();

export async function verifyGoogleTokenAndGetUser(credential: string) {
  let googleUser: {
    sub: string;
    email: string;
    name: string;
    picture?: string;
  };

  // If real Google Client ID is configured and credential looks like a real Google JWT
  if (GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('your-google-client-id') && credential.split('.').length === 3) {
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Invalid Google token payload');
      }
      googleUser = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
      };
    } catch (err: any) {
      // In development fallback if client mismatch
      if (process.env.NODE_ENV !== 'production') {
        const decoded = jwt.decode(credential) as any;
        if (decoded && decoded.email) {
          googleUser = {
            sub: decoded.sub || `google-${Date.now()}`,
            email: decoded.email,
            name: decoded.name || decoded.email.split('@')[0],
            picture: decoded.picture,
          };
        } else {
          throw new Error(`Google token verification failed: ${err.message}`);
        }
      } else {
        throw err;
      }
    }
  } else {
    // Development/demo mode decoding or mock payload
    const decoded = jwt.decode(credential) as any;
    if (decoded && decoded.email) {
      googleUser = {
        sub: decoded.sub || `google-${Date.now()}`,
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        picture: decoded.picture,
      };
    } else {
      // Simulated demo user for local test tokens
      googleUser = {
        sub: 'demo-google-user-101',
        email: 'alex.merchant@feedbackhub.io',
        name: 'Alex Merchant',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      };
    }
  }

  // Database upsert check (Supabase PostgreSQL / profiles table)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  let dbProfile = null;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id') && !supabaseKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Check existing user
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', googleUser.email)
        .maybeSingle();

      if (existingUser) {
        dbProfile = existingUser;
      } else {
        // Create new user profile in database
        const newProfile = {
          id: googleUser.sub.includes('-') ? googleUser.sub : crypto.randomUUID(),
          email: googleUser.email,
          full_name: googleUser.name,
          avatar_url: googleUser.picture || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (!insertErr && inserted) {
          dbProfile = inserted;
        }
      }
    } catch (dbErr) {
      console.warn('Database upsert warning (falling back to cached profile):', dbErr);
    }
  }

  // If DB not connected yet, use memory map
  if (!dbProfile) {
    if (!memoryUsers.has(googleUser.email)) {
      memoryUsers.set(googleUser.email, {
        id: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        avatar_url: googleUser.picture,
        created_at: new Date().toISOString(),
      });
    }
    dbProfile = memoryUsers.get(googleUser.email);
  }

  // Issue secure application JWT token
  const appToken = jwt.sign(
    {
      userId: dbProfile.id,
      email: dbProfile.email,
      name: dbProfile.full_name || dbProfile.name || googleUser.name,
      avatar: dbProfile.avatar_url || googleUser.picture,
      authProvider: 'google',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token: appToken,
    user: {
      id: dbProfile.id,
      email: dbProfile.email,
      name: dbProfile.full_name || dbProfile.name || googleUser.name,
      avatar: dbProfile.avatar_url || googleUser.picture,
      authProvider: 'google',
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { credential, idToken } = req.body || {};
    const tokenToVerify = credential || idToken;

    if (!tokenToVerify) {
      return res.status(400).json({
        error: 'Missing Google credential or idToken in request body.',
      });
    }

    const authResult = await verifyGoogleTokenAndGetUser(tokenToVerify);

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token: authResult.token,
      user: authResult.user,
    });
  } catch (err: any) {
    console.error('Error in /api/auth/google:', err);
    return res.status(401).json({
      success: false,
      error: err.message || 'Failed to authenticate Google user token',
    });
  }
}
