import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const platform = searchParams.get('platform') || 'all'

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Fetch all ads
    const { data: adsData, error: adsErr } = await supabase
      .schema('paid_media')
      .from('ads_index')
      .select('id, name, campaign_id, status, preview_shareable_link, updated_at')
      .order('status', { ascending: true }) // ACTIVE first
      .order('name', { ascending: true })

    if (adsErr) throw adsErr

    // Fetch all campaigns for name lookup
    const campaignIds = [...new Set((adsData || []).map((a: { campaign_id: string }) => a.campaign_id))]
    const { data: campaignsData } = await supabase
      .schema('paid_media')
      .from('campaigns_index')
      .select('id, name, platform')
      .in('id', campaignIds)

    const campaignMap = new Map(
      (campaignsData || []).map((c: { id: string; name: string; platform: string }) => [c.id, c])
    )

    const ads = (adsData || [])
      .map((a: { id: string; name: string; campaign_id: string; status: string; preview_shareable_link: string; updated_at: string }) => {
        const campaign = campaignMap.get(a.campaign_id)
        return {
          id: a.id,
          name: a.name,
          campaign_id: a.campaign_id,
          campaign_name: campaign?.name || a.campaign_id,
          platform: (campaign?.platform || 'meta') as 'meta' | 'google',
          status: a.status,
          preview_link: a.preview_shareable_link,
        }
      })
      .filter((a: { platform: string }) => platform === 'all' || a.platform === platform)

    return NextResponse.json({ ads })
  } catch (e: unknown) {
    console.error('[ads API]', e)
    const msg = e instanceof Error ? e.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
