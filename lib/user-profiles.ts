import { supabase } from '@/lib/supabase'

export interface PrimaryUserProfile {
  id: string
  avatar_url: string | null
  avatar_emoji: string | null
}

export function normalizeProfileName(name: string) {
  return name.trim().toLowerCase()
}

export async function getPrimaryUserProfile(name: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, avatar_url, avatar_emoji')
    .ilike('name', normalizeProfileName(name))
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as PrimaryUserProfile | null
}

export async function updatePrimaryUserAvatar(name: string, avatar: string) {
  const profile = await getPrimaryUserProfile(name)
  if (!profile) return false

  const isUrl = avatar.startsWith('http')
  const { error } = await supabase
    .from('user_profiles')
    .update({
      avatar_emoji: isUrl ? null : avatar,
      avatar_url: isUrl ? avatar : null,
    })
    .eq('id', profile.id)

  if (error) throw error
  return true
}
