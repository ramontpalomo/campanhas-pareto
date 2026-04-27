import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as never

export type Platform = 'meta' | 'google'

export interface CampaignMetric {
  id: number
  platform: Platform
  campaign_id: string
  campaign_name: string
  product: string
  date: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  cost_per_conversion: number
  conversion_event: string
  synced_at: string
}
