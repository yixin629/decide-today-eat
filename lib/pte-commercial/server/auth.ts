import 'server-only'
import { createClient, type User } from '@supabase/supabase-js'
import { commercialConfig } from './config'

export async function authenticatedUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  const token = authorization.slice(7).trim()
  if (!token) return null
  const config = commercialConfig()
  if (!config.enabled || !config.supabaseUrl || !config.supabaseAnonKey) return null
  const client = createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await client.auth.getUser(token)
  return error ? null : data.user
}

export function bearerToken(request: Request) {
  const value = request.headers.get('authorization')
  return value?.startsWith('Bearer ') ? value.slice(7).trim() : ''
}
