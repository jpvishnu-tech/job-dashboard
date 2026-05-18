import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
  console.error('[Supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.');
}

/**
 * Supabase client — null when not configured.
 * Always check isSupabaseConfigured before calling methods on this.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
