import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'daily-focus-auth'  // Add a unique storage key
  }
});

// Prevent multiple instances in development
if (process.env.NODE_ENV === 'development') {
  if ((globalThis).supabase) {
    console.warn('Reusing existing Supabase instance');
    module.exports = (globalThis).supabase;
  } else {
    (globalThis).supabase = supabase;
  }
}

export default supabase;
