import 'server-only'
import { commercialConfig } from './config'
export { verifyStripeSignature } from '../stripe-signature'

const STRIPE_API = 'https://api.stripe.com/v1'

export async function stripePost(path: string, values: Record<string, string>) {
  const { stripeSecretKey } = commercialConfig()
  if (!stripeSecretKey) throw new Error('STRIPE_NOT_CONFIGURED')
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${stripeSecretKey}:`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(values),
    cache: 'no-store',
  })
  const data: unknown = await response.json()
  if (!response.ok) throw new Error('STRIPE_REQUEST_FAILED')
  return data as Record<string, unknown>
}

export function stringField(value: unknown) {
  return typeof value === 'string' ? value : null
}
