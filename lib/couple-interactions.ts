import { supabase } from '@/lib/supabase'

export type CoupleUser = 'zyx' | 'zly'

export function partnerOf(user: string): CoupleUser {
  return user === 'zyx' ? 'zly' : 'zyx'
}

export async function createCoupleNotification({
  actor,
  type,
  title,
  message,
  link,
  metadata = {},
}: {
  actor: string
  type: string
  title: string
  message: string
  link?: string
  metadata?: Record<string, unknown>
}) {
  const { error } = await supabase.from('couple_notifications').insert({
    recipient: partnerOf(actor),
    actor,
    notification_type: type,
    title,
    message,
    link: link ?? '/',
    metadata,
  })

  if (error) throw error
}
