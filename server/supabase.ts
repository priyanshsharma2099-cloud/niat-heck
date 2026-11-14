import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseReady = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
  );
};

export const supabaseAdmin: SupabaseClient | null = isSupabaseReady()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
