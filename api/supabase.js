import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Get site URL from environment or default to localhost
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL 
  || process.env.NEXT_PUBLIC_VERCEL_URL 
  || 'http://localhost:3000'

// Ensure URL has https:// prefix
const getRedirectTo = (url) => {
  if (!url.startsWith('http')) {
    return `https://${url}/auth/callback`
  }
  return `${url}/auth/callback`
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    redirect_to: getRedirectTo(siteUrl)
  }
})

export default supabase
