import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

let supabaseInstance = null;

function getSupabaseInstance() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'daily-focus-auth'
    }
  });

  return supabaseInstance;
}

const supabase = getSupabaseInstance();

if (process.env.NODE_ENV === 'development') {
  if ((globalThis).supabase) {
    console.warn('Reusing existing Supabase instance');
  } else {
    (globalThis).supabase = supabase;
  }
}

export default supabase;
