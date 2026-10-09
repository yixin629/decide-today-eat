import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { commercialConfig } from './config'

export function commercialAdmin() {
  const config = commercialConfig()
  if (!config.enabled || !config.supabaseUrl || !config.supabaseServiceRoleKey) return null
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
