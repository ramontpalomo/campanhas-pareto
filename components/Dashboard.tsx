'use client'

import { useState } from 'react'
import { format, subDays, startOfMonth } from 'date-fns'
import Image from 'next/image'
import { CalendarDays, RefreshCw, AlertTriangle, ChevronDown, Pin, X, Plus } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useHotspots, HOTSPOT_COLORS } from '@/hooks/useHotspots'
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

  // Hotspot modal state
  const [showHotspotModal, setShowHotspotModal] = useState(false)
  const [hsDate, setHsDate] = useState(fmt(subDays(today, 1)))
  const [hsLabel, setHsLabel] = useState('')
  const [hsColor, setHsColor] = useState(HOTSPOT_COLORS[0].value)

  const { campaigns, dailyMetrics, loading, error, lastSync, refetch } = useCampaigns(startDate, endDate)
  const { hotspots, addHotspot, removeHotspot } = useHotspots()

  const handlePreset = (i: number) => {
    setStartDate(PRESETS[i].start)
    setEndDate(PRESETS[i].end)
    setActivePreset(i)
  }

  const handleAddHotspot = () => {
    if (!hsLabel.trim() || !hsDate) return
    addHotspot({ date: hsDate, label: hsLabel.trim(), color: hsColor })
    setHsLabel('')
    setHsDate(fmt(subDays(today, 1)))
    setHsColor(HOTSPOT_COLORS[0].value)
    setShowHotspotModal(false)
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
          <div className="flex items-center gap-4">
            <Image
              src="/pareto-logo.png"
              alt="Pareto"
              width={100}
              height={24}
              className="h-7 w-auto"
              priority
            />
            <div className="h-5 w-px bg-gray-200" />
            <div>
              <h1 className="text-sm font-semibold text-gray-700">Dashboard de Campanhas</h1>
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
            <div className="flex items-center gap-2">
              {/* Add Hotspot button */}
              <button
                onClick={() => setShowHotspotModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                title="Adicionar marcação no gráfico"
              >
                <Pin className="w-3.5 h-3.5" />
                <span>Marcação</span>
                <Plus className="w-3 h-3" />
              </button>
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
          </div>

          {loading ? (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              Carregando...
            </div>
          ) : (
            <EvolutionChart
              dailyMetrics={dailyMetrics.filter(d => platform === 'all' || true)}
              metric={chartMetric}
              hotspots={hotspots}
            />
          )}

          {/* Hotspot legend below chart */}
          {hotspots.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                <Pin className="w-3 h-3" /> Marcações
              </p>
              <div className="flex flex-wrap gap-2">
                {hotspots
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(h => (
                    <div
                      key={h.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: h.color }}
                    >
                      <span>{format(new Date(h.date + 'T12:00:00'), 'dd/MM')}</span>
                      <span className="opacity-80">·</span>
                      <span>{h.label}</span>
                      <button
                        onClick={() => removeHotspot(h.id)}
                        className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
                        title="Remover marcação"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
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

      {/* Hotspot Modal */}
      {showHotspotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Pin className="w-4 h-4 text-gray-500" />
                Nova Marcação
              </h3>
              <button
                onClick={() => setShowHotspotModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data da mudança</label>
                <input
                  type="date"
                  value={hsDate}
                  onChange={e => setHsDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Label */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição da mudança</label>
                <input
                  type="text"
                  value={hsLabel}
                  onChange={e => setHsLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddHotspot()}
                  placeholder="Ex: Novo criativo ativado"
                  maxLength={60}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-300"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Cor</label>
                <div className="flex gap-2">
                  {HOTSPOT_COLORS.map(c => (
                    <button
                      key={c.value}
                      title={c.name}
                      onClick={() => setHsColor(c.value)}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                      style={{ backgroundColor: c.value }}
                    >
                      {hsColor === c.value && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowHotspotModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddHotspot}
                disabled={!hsLabel.trim() || !hsDate}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
