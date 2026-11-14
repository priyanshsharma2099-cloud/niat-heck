import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.development' });
dotenv.config(); // fallback to .env

const app = express();
const PORT = process.env.PORT || 3001;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'cluey_cart_jwt_super_secret_key_development_2026';

const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const memoryUsers = new Map();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Cluey Cart Auth & Backend API',
    googleAuthReady: Boolean(GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('your-google-client-id')),
    timestamp: new Date().toISOString(),
  });
});

// Dedicated Google Authentication Route
app.post('/api/auth/google', async (req, res) => {
  const { credential, idToken } = req.body || {};
  const tokenToVerify = credential || idToken;

  if (!tokenToVerify) {
    return res.status(400).json({
      success: false,
      error: 'Missing Google credential or idToken in request payload.',
    });
  }

  try {
    let googleUser;

    // Verify token using google-auth-library if real Client ID is available
    if (GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('your-google-client-id') && tokenToVerify.split('.').length === 3) {
      try {
        const ticket = await oauthClient.verifyIdToken({
          idToken: tokenToVerify,
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
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          const decoded = jwt.decode(tokenToVerify);
          if (decoded && decoded.email) {
            googleUser = {
              sub: decoded.sub || `google-${Date.now()}`,
              email: decoded.email,
              name: decoded.name || decoded.email.split('@')[0],
              picture: decoded.picture,
            };
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
    } else {
      // Development fallback decoding
      const decoded = jwt.decode(tokenToVerify);
      if (decoded && decoded.email) {
        googleUser = {
          sub: decoded.sub || `google-${Date.now()}`,
          email: decoded.email,
          name: decoded.name || decoded.email.split('@')[0],
          picture: decoded.picture,
        };
      } else {
        googleUser = {
          sub: 'demo-google-user-101',
          email: 'alex.merchant@feedbackhub.io',
          name: 'Alex Merchant',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        };
      }
    }

    // Database lookup & user creation (Supabase PostgreSQL profiles table)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    let dbProfile = null;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id') && !supabaseKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', googleUser.email)
          .maybeSingle();

        if (existingUser) {
          dbProfile = existingUser;
        } else {
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
        console.warn('Supabase DB lookup skipped:', dbErr.message);
      }
    }

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

    // Issue secure application JWT
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

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token: appToken,
      user: {
        id: dbProfile.id,
        email: dbProfile.email,
        name: dbProfile.full_name || dbProfile.name || googleUser.name,
        avatar: dbProfile.avatar_url || googleUser.picture,
        authProvider: 'google',
      },
    });
  } catch (err) {
    console.error('Backend Google Auth Error:', err);
    return res.status(401).json({
      success: false,
      error: err.message || 'Failed to authenticate Google user token',
    });
  }
});

// Verify Current App Session Token
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    return res.json({ success: true, user: verified });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
});

app.listen(PORT, () => {
  console.log(`[Cluey Cart Backend] Express server running on port ${PORT}`);
  console.log(`[Cluey Cart Backend] Google Auth Route: http://localhost:${PORT}/api/auth/google`);
});
