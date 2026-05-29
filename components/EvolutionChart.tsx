'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { DailyMetric } from '@/hooks/useCampaigns'
import { PRODUCTS_ORDER, PRODUCT_COLORS } from '@/lib/config'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, X } from 'lucide-react'

interface Hotspot {
  id: string
  dateLabel: string // dd/MM — matches XAxis dataKey
  text: string
}

interface Props {
  dailyMetrics: DailyMetric[]
  metric: 'spend' | 'conversions' | 'cost_per_conversion'
}

const STORAGE_KEY = 'campaign-hotspots'

function loadHotspots(): Hotspot[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveHotspots(hs: Hotspot[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hs))
}

// Custom label rendered on top of the dotted ReferenceLine
function HotspotLabel({
  viewBox,
  text,
}: {
  viewBox?: { x?: number; y?: number; width?: number; height?: number }
  text: string
}) {
  const x = viewBox?.x ?? 0
  const y = viewBox?.y ?? 0
  const display = text.length > 14 ? text.slice(0, 14) + '…' : text
  const boxW = Math.max(display.length * 6.5 + 12, 52)
  return (
    <g>
      <rect
        x={x - boxW / 2}
        y={y - 22}
        width={boxW}
        height={18}
        rx={4}
        fill="#d97706"
        opacity={0.92}
      />
      <text
        x={x}
        y={y - 9}
        textAnchor="middle"
        fill="white"
        fontSize={10}
        fontWeight={600}
      >
        {display}
      </text>
    </g>
  )
}

export function EvolutionChart({ dailyMetrics, metric }: Props) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newText, setNewText] = useState('')

  // Hydrate from localStorage on mount
  useEffect(() => {
    setHotspots(loadHotspots())
  }, [])

  const addHotspot = () => {
    if (!newDate || !newText.trim()) return
    const h: Hotspot = {
      id: Date.now().toString(),
      dateLabel: newDate,
      text: newText.trim(),
    }
    const updated = [...hotspots, h]
    setHotspots(updated)
    saveHotspots(updated)
    setShowModal(false)
    setNewDate('')
    setNewText('')
  }

  const removeHotspot = (id: string) => {
    const updated = hotspots.filter(h => h.id !== id)
    setHotspots(updated)
    saveHotspots(updated)
  }

  // ── existing chart logic ────────────────────────────────────
  const products = PRODUCTS_ORDER.filter(p =>
    dailyMetrics.some(d => d.product === p)
  )

  const dateMap = new Map<string, Record<string, number>>()
  for (const d of dailyMetrics) {
    if (!dateMap.has(d.date)) dateMap.set(d.date, {})
    dateMap.get(d.date)![d.product] = d[metric] || 0
  }

  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      label: format(parseISO(date), 'dd/MM', { locale: ptBR }),
      ...vals,
    }))

  const availableLabels = chartData.map(d => d.label)
  const visibleHotspots = hotspots.filter(h => availableLabels.includes(h.dateLabel))

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Sem dados para o período selecionado
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Chart area — extra top margin to fit labels */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 28, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v =>
                metric === 'spend' || metric === 'cost_per_conversion' ? `R$${v}` : String(v)
              }
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((value: any, name: string) => [
                metric === 'spend' || metric === 'cost_per_conversion'
                  ? `R$ ${(value as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : (value as number).toFixed(0),
                name,
              ]) as any}
              labelFormatter={label => `Data: ${label}`}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            {products.map(product => (
              <Line
                key={product}
                type="monotone"
                dataKey={product}
                name={product}
                stroke={PRODUCT_COLORS[product]}
                strokeWidth={2}
                dot={false}
              />
            ))}
            {/* Hotspot reference lines */}
            {visibleHotspots.map(h => (
              <ReferenceLine
                key={h.id}
                x={h.dateLabel}
                stroke="#d97706"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={<HotspotLabel text={h.text} /> as any}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* "+" button — bottom-right corner */}
      <button
        onClick={() => setShowModal(true)}
        className="absolute bottom-6 right-0 w-7 h-7 rounded-md border border-amber-400 text-amber-500 hover:bg-amber-50 flex items-center justify-center transition-colors"
        title="Adicionar hotspot"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Modal overlay */}
      {showModal && (
        <div className="absolute inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5 w-72">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Adicionar Hotspot</h3>
              <button
                onClick={() => { setShowModal(false); setNewDate(''); setNewText('') }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Date picker */}
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Dia</label>
                <select
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Selecionar data…</option>
                  {availableLabels.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Text input */}
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Anotação</label>
                <input
                  type="text"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="Ex: Campanha pausada"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  onKeyDown={e => e.key === 'Enter' && addHotspot()}
                />
              </div>

              <button
                onClick={addHotspot}
                disabled={!newDate || !newText.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-100 disabled:text-gray-400 text-white font-medium text-sm py-2 rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>

            {/* Existing hotspots list */}
            {hotspots.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium mb-2">Hotspots cadastrados</p>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {hotspots.map(h => (
                    <div key={h.id} className="flex items-center gap-2 py-1">
                      <span className="text-xs text-amber-600 font-semibold w-10 shrink-0">
                        {h.dateLabel}
                      </span>
                      <span className="text-xs text-gray-600 flex-1 truncate">{h.text}</span>
                      <button
                        onClick={() => removeHotspot(h.id)}
                        className="text-gray-300 hover:text-red-400 shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
