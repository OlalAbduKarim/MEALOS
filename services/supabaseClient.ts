import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL || 'https://xojheaczfnlsszghykej.supabase.co';
const supabaseAnonKey = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvamhlYWN6Zm5sc3N6Z2h5a2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMzg4MDYsImV4cCI6MjEwODYxNDgwNn0.3t7d3gIbD7K2Hp-oRiwW0-W55yWAURpx54icPsMYZHg';

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
 * Checks connection to Supabase and verifies if the project is reachable.
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  if (!supabase) {
    return { connected: false, message: 'Supabase credentials not configured.' };
  }
  try {
    // Attempt lightweight ping to verify reachable endpoint
    const { error } = await supabase.from('projects').select('id').limit(1);
    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation "projects" does not exist')) {
        return { 
          connected: true, 
          message: 'Connected to Supabase project! Database tables need to be created with the SQL migration script.' 
        };
      }
      return { connected: true, message: `Connected to Supabase (${error.message})` };
    }
    return { connected: true, message: 'Supabase connected and database tables ready!' };
  } catch (err: any) {
    return { connected: false, message: err.message || 'Could not reach Supabase endpoint.' };
  }
}
