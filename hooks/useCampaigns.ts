'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, CampaignMetric } from '@/lib/supabase'
import { detectProduct, detectConversionEvent } from '@/lib/config'

export interface AggregatedCampaign {
  campaign_id: string
  campaign_name: string
  platform: 'meta' | 'google'
  product: string
  conversion_event: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  cost_per_conversion: number
}

export interface DailyMetric {
  date: string
  product: string
  spend: number
  conversions: number
  cost_per_conversion: number
}

export function useCampaigns(startDate: string, endDate: string) {
  const [campaigns, setCampaigns] = useState<AggregatedCampaign[]>([])
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: dbError } = await supabase
        .schema('campaigns')
        .from('campaign_metrics')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (dbError) throw dbError

      const metrics: CampaignMetric[] = data || []

      // Aggregate by campaign
      const campaignMap = new Map<string, AggregatedCampaign>()
      for (const m of metrics) {
        const key = `${m.platform}:${m.campaign_id}`
        if (!campaignMap.has(key)) {
          campaignMap.set(key, {
            campaign_id: m.campaign_id,
            campaign_name: m.campaign_name,
            platform: m.platform,
            product: m.product || detectProduct(m.campaign_name),
            conversion_event: m.conversion_event || detectConversionEvent(m.campaign_name),
            spend: 0,
            impressions: 0,
            clicks: 0,
            ctr: 0,
            cpc: 0,
            conversions: 0,
            cost_per_conversion: 0,
          })
        }
        const c = campaignMap.get(key)!
        c.spend += m.spend
        c.impressions += m.impressions
        c.clicks += m.clicks
        c.conversions += m.conversions
      }

      // Recalculate derived metrics
      const aggregated = Array.from(campaignMap.values()).map(c => ({
        ...c,
        spend: Math.round(c.spend * 100) / 100,
        ctr: c.impressions > 0 ? Math.round((c.clicks / c.impressions) * 10000) / 100 : 0,
        cpc: c.clicks > 0 ? Math.round((c.spend / c.clicks) * 100) / 100 : 0,
        cost_per_conversion: c.conversions > 0 ? Math.round((c.spend / c.conversions) * 100) / 100 : 0,
      }))

      setCampaigns(aggregated.sort((a, b) => b.spend - a.spend))

      // Daily by product
      const dailyMap = new Map<string, DailyMetric>()
      for (const m of metrics) {
        const product = m.product || detectProduct(m.campaign_name)
        const key = `${m.date}:${product}`
        if (!dailyMap.has(key)) {
          dailyMap.set(key, { date: m.date, product, spend: 0, conversions: 0, cost_per_conversion: 0 })
        }
        const d = dailyMap.get(key)!
        d.spend += m.spend
        d.conversions += m.conversions
      }

      const daily = Array.from(dailyMap.values()).map(d => ({
        ...d,
        spend: Math.round(d.spend * 100) / 100,
        cost_per_conversion: d.conversions > 0 ? Math.round((d.spend / d.conversions) * 100) / 100 : 0,
      }))

      setDailyMetrics(daily.sort((a, b) => a.date.localeCompare(b.date)))

      // Last sync time
      if (metrics.length > 0) {
        const latest = metrics.reduce((a, b) => a.synced_at > b.synced_at ? a : b)
        setLastSync(latest.synced_at)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { campaigns, dailyMetrics, loading, error, lastSync, refetch: fetchData }
}
