import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string;
  }
  return '';
};

const rawUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://xojheaczfnlsszghykej.supabase.co';
// Strip trailing /rest/v1 or trailing slashes to prevent invalid nested paths
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvamhlYWN6Zm5sc3N6Z2h5a2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMzg4MDYsImV4cCI6MjEwODYxNDgwNn0.3t7d3gIbD7K2Hp-oRiwW0-W55yWAURpx54icPsMYZHg';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Checks connection to Supabase and verifies if the project is reachable and writable.
 */
export async function testSupabaseConnection(): Promise<{ 
  connected: boolean; 
  message: string; 
  writeAllowed: boolean; 
  rlsNotice?: string; 
}> {
  if (!supabase) {
    return { connected: false, message: 'Supabase credentials not configured.', writeAllowed: false };
  }
  try {
    // Attempt lightweight ping to verify reachable endpoint
    const { error } = await supabase.from('projects').select('id').limit(1);
    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation "projects" does not exist')) {
        return { 
          connected: true, 
          message: 'Connected to Supabase project! Database tables need to be created with the SQL migration script.',
          writeAllowed: false
        };
      }
      return { connected: true, message: `Connected to Supabase (${error.message})`, writeAllowed: false };
    }

    // Probe write capability with temporary probe ID
    const testProbe = await supabase.from('projects').insert({ id: 'probe_check_write' }).select('id');
    let writeAllowed = true;
    let rlsNotice: string | undefined = undefined;

    if (testProbe.error) {
      if (testProbe.error.code === '42501') {
        writeAllowed = false;
        rlsNotice = 'Database tables exist, but Row-Level Security (RLS) policies currently block writes. Run the SQL script in fix_rls_policies.sql in your Supabase SQL Editor to enable full CRUD.';
      }
    } else {
      // Clean up probe row
      await supabase.from('projects').delete().eq('id', 'probe_check_write');
    }

    return { 
      connected: true, 
      message: 'Supabase connected and database tables ready!', 
      writeAllowed,
      rlsNotice 
    };
  } catch (err: any) {
    return { connected: false, message: err.message || 'Could not reach Supabase endpoint.', writeAllowed: false };
  }
}
