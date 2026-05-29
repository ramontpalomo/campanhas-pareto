import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { detectProduct, detectConversionEvent } from '@/lib/config'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Fetch Meta daily data
    const { data: metaData, error: metaErr } = await supabase
      .schema('paid_media')
      .from('meta_ads_daily')
      .select(`
        campaign_id,
        date_start,
        spend,
        impressions,
        clicks,
        leads,
        purchases,
        purchase_value,
        add_to_cart,
        complete_registration,
        cpm, cpc, ctr,
        created_at
      `)
      .gte('date_start', startDate)
      .lte('date_start', endDate)
      .order('date_start', { ascending: true })

    if (metaErr) throw metaErr

    // Fetch Google daily data
    const { data: googleData, error: googleErr } = await supabase
      .schema('paid_media')
      .from('google_ads_daily')
      .select(`
        campaign_id,
        date_start,
        spend,
        impressions,
        clicks,
        conversions,
        conversion_value,
        cpm, cpc, ctr,
        created_at
      `)
      .gte('date_start', startDate)
      .lte('date_start', endDate)
      .order('date_start', { ascending: true })

    if (googleErr) throw googleErr

    // Fetch campaigns index for names
    const allCampaignIds = [
      ...new Set([
        ...(metaData || []).map((r: { campaign_id: string }) => r.campaign_id),
        ...(googleData || []).map((r: { campaign_id: string }) => r.campaign_id),
      ])
    ]

    const { data: campaignsIndex } = await supabase
      .schema('paid_media')
      .from('campaigns_index')
      .select('id, name, platform, product_slug')
      .in('id', allCampaignIds)

    const campaignMap = new Map(
      (campaignsIndex || []).map((c: { id: string; name: string; platform: string; product_slug: string }) => [c.id, c])
    )

    // Normalize Meta rows
    const metaNormalized = (metaData || []).map((r: {
      campaign_id: string; date_start: string; spend: number; impressions: number;
      clicks: number; leads: number; purchases: number; purchase_value: number;
      add_to_cart: number; complete_registration: number; cpm: number; cpc: number; ctr: number; created_at: string;
    }) => {
      const campaign = campaignMap.get(r.campaign_id)
      const metaCampaignName = campaign?.name || r.campaign_id
      return {
        campaign_id: r.campaign_id,
        campaign_name: metaCampaignName,
        platform: 'meta' as const,
        product: detectProduct(metaCampaignName),
        date: r.date_start,
        spend: r.spend || 0,
        impressions: r.impressions || 0,
        clicks: r.clicks || 0,
        conversions: (r.leads || 0) + (r.purchases || 0) + (r.add_to_cart || 0) + (r.complete_registration || 0),
        conversion_event: detectConversionEvent(metaCampaignName),
        cpm: r.cpm || 0,
        cpc: r.cpc || 0,
        ctr: r.ctr || 0,
        synced_at: r.created_at,
      }
    })

    // Normalize Google rows
    const googleNormalized = (googleData || []).map((r: {
      campaign_id: string; date_start: string; spend: number; impressions: number;
      clicks: number; conversions: number; conversion_value: number; cpm: number; cpc: number; ctr: number; created_at: string;
    }) => {
      const campaign = campaignMap.get(r.campaign_id)
      const googleCampaignName = campaign?.name || r.campaign_id
      return {
        campaign_id: r.campaign_id,
        campaign_name: googleCampaignName,
        platform: 'google' as const,
        product: detectProduct(googleCampaignName),
        date: r.date_start,
        spend: r.spend || 0,
        impressions: r.impressions || 0,
        clicks: r.clicks || 0,
        conversions: r.conversions || 0,
        conversion_event: detectConversionEvent(googleCampaignName),
        cpm: r.cpm || 0,
        cpc: r.cpc || 0,
        ctr: r.ctr || 0,
        synced_at: r.created_at,
      }
    })

    const allMetrics = [...metaNormalized, ...googleNormalized]

    // Last sync
    const lastSync = allMetrics.reduce((latest, m) => m.synced_at > latest ? m.synced_at : latest, '')

    return NextResponse.json({ metrics: allMetrics, lastSync: lastSync || null })
  } catch (e: unknown) {
    console.error('[campaigns API]', e)
    const msg = e instanceof Error ? e.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
