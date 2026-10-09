import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyStripeSignature(payload: string, header: string, secret: string, now = Date.now()) {
  const parts = header.split(',').map((part) => part.split('='))
  const timestamp = parts.find(([key]) => key === 't')?.[1]
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value)
  if (!timestamp || !signatures.length || Math.abs(now / 1000 - Number(timestamp)) > 300) return false
  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`, 'utf8').digest('hex')
  const expectedBuffer = Buffer.from(expected)
  return signatures.some((signature) => {
    const candidate = Buffer.from(signature)
    return candidate.length === expectedBuffer.length && timingSafeEqual(candidate, expectedBuffer)
  })
}
