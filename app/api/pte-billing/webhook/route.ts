import { NextResponse } from 'next/server'
import { commercialAdmin } from '@/lib/pte-commercial/server/admin'
import { commercialConfig } from '@/lib/pte-commercial/server/config'
import { stringField, verifyStripeSignature } from '@/lib/pte-commercial/server/stripe'
import type { PtePlanCode } from '@/lib/pte-commercial/public-config'

export const runtime = 'nodejs'

type JsonObject = Record<string, unknown>

function object(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {}
}

function planFor(subscription: JsonObject, monthly: string, yearly: string): PtePlanCode {
  const metadataPlan = stringField(object(subscription.metadata).plan)
  if (metadataPlan === 'monthly' || metadataPlan === 'yearly') return metadataPlan
  const items = object(subscription.items).data
  const first = Array.isArray(items) ? object(items[0]) : {}
  const priceId = stringField(object(first.price).id)
  return priceId === yearly ? 'yearly' : priceId === monthly ? 'monthly' : 'free'
}

function isoFromUnix(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? new Date(value * 1000).toISOString() : null
}

async function syncSubscription(subscription: JsonObject) {
  const config = commercialConfig()
  const admin = commercialAdmin()
  if (!admin) throw new Error('ADMIN_NOT_CONFIGURED')
  const metadata = object(subscription.metadata)
  const userId = stringField(metadata.user_id)
  if (!userId) return
  const status = stringField(subscription.status) ?? 'inactive'
  const active = status === 'active' || status === 'trialing'
  const plan = active ? planFor(subscription, config.monthlyPriceId, config.yearlyPriceId) : 'free'
  const { error } = await admin.from('pte_memberships').upsert({
    user_id: userId,
    plan,
    status,
    stripe_customer_id: stringField(subscription.customer),
    stripe_subscription_id: stringField(subscription.id),
    current_period_end: isoFromUnix(subscription.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end === true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw error
  const { error: entitlementError } = await admin.from('pte_entitlements').upsert({
    user_id: userId,
    question_bank: active ? 'full' : 'starter',
    mock_exams_per_month: active ? 20 : 1,
    ai_scores_per_month: active ? 100 : 5,
    teacher_feedback: active,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (entitlementError) throw entitlementError
}

export async function POST(request: Request) {
  const config = commercialConfig()
  if (!config.enabled) return NextResponse.json({ error: 'disabled' }, { status: 404 })
  if (!config.stripeWebhookSecret) return NextResponse.json({ error: 'not_configured' }, { status: 501 })
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature') ?? ''
  if (!verifyStripeSignature(payload, signature, config.stripeWebhookSecret)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  let event: JsonObject
  try { event = object(JSON.parse(payload)) } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const eventId = stringField(event.id)
  const eventType = stringField(event.type)
  if (!eventId || !eventType) return NextResponse.json({ error: 'invalid_event' }, { status: 400 })
  const admin = commercialAdmin()
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 501 })

  const eventObject = object(object(event.data).object)
  const { error: insertError } = await admin.from('pte_payment_events').insert({
    event_id: eventId,
    event_type: eventType,
    stripe_object_id: stringField(eventObject.id),
  })
  if (insertError?.code === '23505') {
    const { data: stored } = await admin.from('pte_payment_events').select('processed_at').eq('event_id', eventId).maybeSingle()
    if (stored?.processed_at) return NextResponse.json({ received: true, duplicate: true })
  }
  if (insertError && insertError.code !== '23505') return NextResponse.json({ error: 'event_store_failed' }, { status: 500 })

  try {
    if (eventType.startsWith('customer.subscription.')) await syncSubscription(eventObject)
    if (eventType === 'checkout.session.completed') {
      const metadata = object(eventObject.metadata)
      const userId = stringField(metadata.user_id) ?? stringField(eventObject.client_reference_id)
      if (userId) {
        await admin.from('pte_memberships').update({
          stripe_customer_id: stringField(eventObject.customer),
          stripe_subscription_id: stringField(eventObject.subscription),
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId)
      }
    }
    await admin.from('pte_payment_events').update({ processed_at: new Date().toISOString() }).eq('event_id', eventId)
    return NextResponse.json({ received: true })
  } catch {
    await admin.from('pte_payment_events').update({ processing_error: 'membership_sync_failed' }).eq('event_id', eventId)
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 })
  }
}
