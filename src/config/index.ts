import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceKey: string;
  };
  server: {
    port: number;
  };
  logging: {
    level: string;
    filePath: string;
  };
  sessionSecret: string;
}

function loadConfig(): AppConfig {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
  }

  if (!supabaseServiceKey) {
    console.warn('Warning: SUPABASE_SERVICE_KEY not set. Some features may not work.');
  }

  if (!sessionSecret) {
    throw new Error('Missing SESSION_SECRET. Please set SESSION_SECRET in your .env file');
  }

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceKey: supabaseServiceKey || ''
    },
    server: {
      port: parseInt(process.env.PORT || '3000', 10)
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      filePath: process.env.LOG_FILE_PATH || './logs'
    },
    sessionSecret: sessionSecret
  };
}

// Export a singleton config instance
let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

// Reset config for testing
export function resetConfig(): void {
  configInstance = null;
}
