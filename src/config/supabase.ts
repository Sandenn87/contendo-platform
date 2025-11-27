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

// For backward compatibility - lazy getters
export const supabaseClient = {
  get auth() { return getSupabaseClient().auth; },
  get from() { return getSupabaseClient().from.bind(getSupabaseClient()); },
  get rpc() { return getSupabaseClient().rpc.bind(getSupabaseClient()); },
  get storage() { return getSupabaseClient().storage; },
  get realtime() { return getSupabaseClient().realtime; },
  get rest() { return getSupabaseClient().rest; },
} as SupabaseClient;

export const supabaseAdmin = {
  get auth() { return getSupabaseAdmin().auth; },
  get from() { return getSupabaseAdmin().from.bind(getSupabaseAdmin()); },
  get rpc() { return getSupabaseAdmin().rpc.bind(getSupabaseAdmin()); },
  get storage() { return getSupabaseAdmin().storage; },
  get realtime() { return getSupabaseAdmin().realtime; },
  get rest() { return getSupabaseAdmin().rest; },
} as SupabaseClient;

export default supabaseClient;
