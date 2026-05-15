import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[Supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your .env file.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/** True when both Supabase env vars are present and non-empty. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
