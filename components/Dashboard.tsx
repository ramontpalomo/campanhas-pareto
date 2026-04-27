'use client'

import { useState } from 'react'
import { format, subDays, startOfMonth } from 'date-fns'
import { CalendarDays, RefreshCw, AlertTriangle, ChevronDown } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { CampaignsTable } from '@/components/CampaignsTable'
import { EvolutionChart } from '@/components/EvolutionChart'

const today = new Date()
const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

const PRESETS = [
  { label: 'Últimos 7 dias', start: fmt(subDays(today, 7)), end: fmt(subDays(today, 1)) },
  { label: 'Últimos 30 dias', start: fmt(subDays(today, 30)), end: fmt(subDays(today, 1)) },
  { label: 'Este mês', start: fmt(startOfMonth(today)), end: fmt(subDays(today, 1)) },
]

type Platform = 'all' | 'meta' | 'google'
type ChartMetric = 'spend' | 'conversions' | 'cost_per_conversion'

export default function Dashboard() {
  const [startDate, setStartDate] = useState(PRESETS[1].start)
  const [endDate, setEndDate] = useState(PRESETS[1].end)
  const [platform, setPlatform] = useState<Platform>('all')
  const [chartMetric, setChartMetric] = useState<ChartMetric>('spend')
  const [activePreset, setActivePreset] = useState(1)

  const { campaigns, dailyMetrics, loading, error, lastSync, refetch } = useCampaigns(startDate, endDate)

  const handlePreset = (i: number) => {
    setStartDate(PRESETS[i].start)
    setEndDate(PRESETS[i].end)
    setActivePreset(i)
  }

  const totalSpend = campaigns
    .filter(c => platform === 'all' || c.platform === platform)
    .reduce((s, c) => s + c.spend, 0)
  const totalConv = campaigns
    .filter(c => platform === 'all' || c.platform === platform)
    .reduce((s, c) => s + c.conversions, 0)
  const avgCpa = totalConv > 0 ? totalSpend / totalConv : 0
  const bestCpa = campaigns
    .filter(c => (platform === 'all' || c.platform === platform) && c.cost_per_conversion > 0)
    .reduce((best, c) => c.cost_per_conversion < best ? c.cost_per_conversion : best, Infinity)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#A3E635] flex items-center justify-center">
              <span className="text-gray-900 font-bold text-sm">P</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Campanhas Pareto</h1>
              {lastSync && (
                <p className="text-xs text-gray-400">
                  Sincronizado: {format(new Date(lastSync), "dd/MM 'às' HH:mm")}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-end">
          <div className="flex gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => handlePreset(i)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activePreset === i
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setActivePreset(-1) }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <span className="text-gray-400">até</span>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setActivePreset(-1) }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            {(['all', 'meta', 'google'] as Platform[]).map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  platform === p
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p === 'all' ? 'Todas' : p === 'meta' ? 'Meta Ads' : 'Google Ads'}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Erro ao carregar dados</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Gasto total', value: `R$ ${totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
            { label: 'Conversões', value: totalConv.toFixed(0) },
            { label: 'CPA médio', value: avgCpa > 0 ? `R$ ${avgCpa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—' },
            { label: 'Melhor CPA', value: bestCpa < Infinity ? `R$ ${bestCpa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{kpi.label}</p>
              <p className={`text-xl font-bold text-gray-900 mt-1 ${loading ? 'opacity-40' : ''}`}>
                {loading ? '...' : kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-700">Evolução por Produto</h2>
            <div className="relative">
              <select
                value={chartMetric}
                onChange={e => setChartMetric(e.target.value as ChartMetric)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
              >
                <option value="spend">Gasto (R$)</option>
                <option value="conversions">Conversões</option>
                <option value="cost_per_conversion">CPA (R$)</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {loading ? (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              Carregando...
            </div>
          ) : (
            <EvolutionChart
              dailyMetrics={dailyMetrics.filter(d => platform === 'all' || true)}
              metric={chartMetric}
            />
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Performance por Campanha</h2>
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Carregando campanhas...</div>
          ) : (
            <CampaignsTable campaigns={campaigns} platform={platform} />
          )}
        </div>

      </main>
    </div>
  )
}
