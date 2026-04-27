'use client'

import { AggregatedCampaign } from '@/hooks/useCampaigns'
import { ColHeader } from '@/components/Tooltip'
import { COLUMN_TOOLTIPS, PRODUCT_COLORS } from '@/lib/config'

function fmt(n: number) {
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(n: number) {
  return n.toFixed(2) + '%'
}

function scoreColor(value: number, type: 'cpl' | 'ctr' | 'neutral'): string {
  if (type === 'cpl') {
    if (value === 0) return 'text-gray-400'
    if (value <= 20) return 'text-green-600 font-semibold'
    if (value <= 60) return 'text-yellow-600 font-semibold'
    return 'text-red-600 font-semibold'
  }
  if (type === 'ctr') {
    if (value >= 5) return 'text-green-600 font-semibold'
    if (value >= 2) return 'text-yellow-600 font-semibold'
    return 'text-red-600 font-semibold'
  }
  return 'text-gray-800'
}

interface Props {
  campaigns: AggregatedCampaign[]
  platform: 'all' | 'meta' | 'google'
}

export function CampaignsTable({ campaigns, platform }: Props) {
  const filtered = platform === 'all' ? campaigns : campaigns.filter(c => c.platform === platform)

  const totalSpend = filtered.reduce((s, c) => s + c.spend, 0)
  const totalConversions = filtered.reduce((s, c) => s + c.conversions, 0)
  const totalClicks = filtered.reduce((s, c) => s + c.clicks, 0)
  const totalImpressions = filtered.reduce((s, c) => s + c.impressions, 0)

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Nenhuma campanha encontrada para o período selecionado.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Campanha</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Produto</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">
              <ColHeader label="Evento" tooltip={COLUMN_TOOLTIPS.conversion_event} />
            </th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">
              <ColHeader label="Gasto" tooltip={COLUMN_TOOLTIPS.spend} />
            </th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">
              <ColHeader label="Impressões" tooltip={COLUMN_TOOLTIPS.impressions} />
            </th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">
              <ColHeader label="Cliques" tooltip={COLUMN_TOOLTIPS.clicks} />
            </th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">
              <ColHeader label="CTR" tooltip={COLUMN_TOOLTIPS.ctr} />
            </th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">
              <ColHeader label="CPC" tooltip={COLUMN_TOOLTIPS.cpc} />
            </th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">
              <ColHeader label="Conv." tooltip={COLUMN_TOOLTIPS.conversions} />
            </th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">
              <ColHeader label="CPA" tooltip={COLUMN_TOOLTIPS.cost_per_conversion} />
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c, i) => {
            const dot = PRODUCT_COLORS[c.product] || '#94a3b8'
            const isAlert = c.campaign_name.toLowerCase().includes('platform') && c.campaign_name.toLowerCase().includes('#001')
            return (
              <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isAlert ? 'bg-yellow-50' : ''}`}>
                <td className="px-4 py-3 max-w-xs">
                  <div className="font-medium text-gray-800 leading-tight">
                    {c.campaign_name}
                    {isAlert && <span className="ml-1 text-yellow-600 text-xs">⚠️ evento incorreto</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{c.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                    <span className="text-gray-700 text-xs font-medium">{c.product}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{c.conversion_event}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-800">{fmt(c.spend)}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-600">{c.impressions.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-600">{c.clicks.toLocaleString('pt-BR')}</td>
                <td className={`px-4 py-3 text-right font-mono ${scoreColor(c.ctr, 'ctr')}`}>{fmtPct(c.ctr)}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-600">{fmt(c.cpc)}</td>
                <td className={`px-4 py-3 text-right font-mono ${c.conversions > 0 ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>
                  {c.conversions > 0 ? c.conversions.toFixed(0) : '—'}
                </td>
                <td className={`px-4 py-3 text-right font-mono ${scoreColor(c.cost_per_conversion, 'cpl')}`}>
                  {c.cost_per_conversion > 0 ? fmt(c.cost_per_conversion) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t-2 border-gray-200">
            <td className="px-4 py-3 font-semibold text-gray-700" colSpan={3}>Total</td>
            <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{fmt(totalSpend)}</td>
            <td className="px-4 py-3 text-right font-mono text-gray-700">{totalImpressions.toLocaleString('pt-BR')}</td>
            <td className="px-4 py-3 text-right font-mono text-gray-700">{totalClicks.toLocaleString('pt-BR')}</td>
            <td className="px-4 py-3 text-right font-mono text-gray-700">
              {totalImpressions > 0 ? fmtPct(totalClicks / totalImpressions * 100) : '—'}
            </td>
            <td className="px-4 py-3 text-right font-mono text-gray-700">
              {totalClicks > 0 ? fmt(totalSpend / totalClicks) : '—'}
            </td>
            <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{totalConversions.toFixed(0)}</td>
            <td className="px-4 py-3 text-right font-mono text-gray-700">
              {totalConversions > 0 ? fmt(totalSpend / totalConversions) : '—'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
