import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const productionUrl = 'https://daily-focus-ashen.vercel.app'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    redirect_to: process.env.NODE_ENV === 'production' 
      ? `${productionUrl}/auth/callback`
      : 'http://localhost:3000/auth/callback'
  }
})

export default supabase
