import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Server-only client using the service role key -- bypasses Row Level
// Security. NEVER import this from a Client Component; only from Route
// Handlers / Server Actions that need to act as an administrator
// (e.g. approving an Administration-staff account).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
