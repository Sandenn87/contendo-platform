import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabaseClientInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
  }

  return { supabaseUrl, supabaseAnonKey, supabaseServiceKey };
}

// Client-side Supabase client (for frontend) - lazy initialization
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClientInstance) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClientInstance;
}

// Server-side Supabase client with service role (for backend operations) - lazy initialization
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    const { supabaseUrl, supabaseAnonKey, supabaseServiceKey } = getSupabaseConfig();
    supabaseAdminInstance = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return supabaseAdminInstance;
}

// For backward compatibility - will throw error if env vars not set
export const supabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  }
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  }
});

export default supabaseClient;

