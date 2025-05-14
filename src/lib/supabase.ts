import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL no está definida en las variables de entorno');
if (!supabaseAnonKey) throw new Error('VITE_SUPABASE_ANON_KEY no está definida en las variables de entorno');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    redirectTo: `${window.location.origin}/auth/callback`
  },
  global: {
    headers: {
      'X-Client-Info': 'kinesio-web'
    }
  }
});