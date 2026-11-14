import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import app from './server/app';

function expressApiPlugin() {
  return {
    name: 'express-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(app);
    },
  };
}

export default defineConfig({
  plugins: [react(), expressApiPlugin()],
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
});
