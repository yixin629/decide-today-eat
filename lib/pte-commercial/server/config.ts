import 'server-only'

export function commercialConfig() {
  return {
    enabled: process.env.PTE_COMMERCIAL_MODE === 'true',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    monthlyPriceId: process.env.STRIPE_PTE_MONTHLY_PRICE_ID ?? '',
    yearlyPriceId: process.env.STRIPE_PTE_YEARLY_PRICE_ID ?? '',
    siteUrl: (process.env.PTE_SITE_URL ?? '').replace(/\/$/, ''),
  }
}
