'use client'

import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { PRODUCT_COLORS, detectProduct } from '@/lib/config'

interface Ad {
  id: string
  name: string
  campaign_id: string
  campaign_name: string
  platform: 'meta' | 'google'
  status: string
  preview_link: string
}

interface Props {
  platform: 'all' | 'meta' | 'google'
}

export function AdsTable({ platform }: Props) {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'PAUSED'>('all')

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/ads?platform=${platform}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setAds(d.ads || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [platform])

  const filtered = ads.filter(a => {
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.campaign_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const activeCount = ads.filter(a => a.status === 'ACTIVE').length
  const pausedCount = ads.filter(a => a.status === 'PAUSED').length

  if (loading) {
    return <div className="py-12 text-center text-gray-400 text-sm">Carregando anúncios...</div>
  }

  if (error) {
    return <div className="py-8 text-center text-red-500 text-sm">Erro: {error}</div>
  }

  return (
    <div className="space-y-3">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar anúncio ou campanha..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 w-64"
        />
        <div className="flex gap-1.5">
          {(['all', 'ACTIVE', 'PAUSED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? `Todos (${ads.length})` : s === 'ACTIVE' ? `Ativos (${activeCount})` : `Pausados (${pausedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Anúncio</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Campanha</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Produto</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Preview</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  Nenhum anúncio encontrado
                </td>
              </tr>
            ) : filtered.map((a, i) => {
              const product = detectProduct(a.campaign_name)
              const dot = PRODUCT_COLORS[product] || '#94a3b8'
              const isActive = a.status === 'ACTIVE'
              return (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 leading-tight max-w-xs">{a.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{a.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">{a.campaign_name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                      <span className="text-gray-700 text-xs font-medium">{product}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {isActive ? 'Ativo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.preview_link ? (
                      <a
                        href={a.preview_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        Ver anúncio
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
            {filtered.length} anúncio{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
