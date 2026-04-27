'use client'

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { DailyMetric } from '@/hooks/useCampaigns'
import { PRODUCTS_ORDER, PRODUCT_COLORS } from '@/lib/config'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  dailyMetrics: DailyMetric[]
  metric: 'spend' | 'conversions' | 'cost_per_conversion'
}

function formatLabel(metric: string) {
  if (metric === 'spend') return 'Gasto (R$)'
  if (metric === 'conversions') return 'Conversões'
  return 'CPA (R$)'
}

export function EvolutionChart({ dailyMetrics, metric }: Props) {
  // Get all products present in data
  const products = PRODUCTS_ORDER.filter(p =>
    dailyMetrics.some(d => d.product === p)
  )

  // Pivot: date → { [product]: value }
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

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Sem dados para o período selecionado
      </div>
    )
  }

  const ChartComponent = metric === 'spend' ? BarChart : LineChart
  const DataComponent = metric === 'spend' ? Bar : Line

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => metric === 'spend' || metric === 'cost_per_conversion' ? `R$${v}` : String(v)}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any, name: string) => [
              metric === 'spend' || metric === 'cost_per_conversion'
                ? `R$ ${(value as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : (value as number).toFixed(0),
              name
            ]) as any}
            labelFormatter={(label) => `Data: ${label}`}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {products.map(product => (
            <DataComponent
              key={product}
              type="monotone"
              dataKey={product}
              name={product}
              stroke={PRODUCT_COLORS[product]}
              fill={PRODUCT_COLORS[product]}
              strokeWidth={2}
              dot={false}
              stackId={metric === 'spend' ? 'stack' : undefined}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}
