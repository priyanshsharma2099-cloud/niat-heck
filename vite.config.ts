import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

function googleAuthDevPlugin(env: Record<string, string>) {
  return {
    name: 'google-auth-dev-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/auth/google' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const tokenToVerify = parsed.credential || parsed.idToken;

              if (!tokenToVerify) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: 'Missing credential' }));
              }

              const clientId = env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || '';
              const jwtSecret = env.JWT_SECRET || 'cluey_cart_jwt_super_secret_key_development_2026';
              let googleUser: any;

              if (clientId && !clientId.includes('your-google-client-id') && tokenToVerify.split('.').length === 3) {
                try {
                  const client = new OAuth2Client(clientId);
                  const ticket = await client.verifyIdToken({
                    idToken: tokenToVerify,
                    audience: clientId,
                  });
                  const payload = ticket.getPayload();
                  googleUser = {
                    sub: payload?.sub || 'usr',
                    email: payload?.email || '',
                    name: payload?.name || '',
                    picture: payload?.picture,
                  };
                } catch {
                  const d = jwt.decode(tokenToVerify) as any;
                  googleUser = {
                    sub: d?.sub || 'usr',
                    email: d?.email || '',
                    name: d?.name || '',
                    picture: d?.picture,
                  };
                }
              } else {
                const d = jwt.decode(tokenToVerify) as any;
                if (d && d.email) {
                  googleUser = {
                    sub: d.sub || `google-${Date.now()}`,
                    email: d.email,
                    name: d.name || d.email.split('@')[0],
                    picture: d.picture,
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

              const appToken = jwt.sign(
                {
                  userId: googleUser.sub,
                  email: googleUser.email,
                  name: googleUser.name,
                  avatar: googleUser.picture,
                  authProvider: 'google',
                },
                jwtSecret,
                { expiresIn: '7d' }
              );

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  message: 'Google authentication successful',
                  token: appToken,
                  user: {
                    id: googleUser.sub,
                    email: googleUser.email,
                    name: googleUser.name,
                    avatar: googleUser.picture,
                    authProvider: 'google',
                  },
                })
              );
            } catch (err: any) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message || 'Token verification error' }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), googleAuthDevPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: false,
    },
  };
});
