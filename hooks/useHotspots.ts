'use client'

import { useState, useEffect } from 'react'

export interface Hotspot {
  id: string
  date: string   // yyyy-MM-dd
  label: string
  color: string
}

export const HOTSPOT_COLORS = [
  { name: 'Laranja', value: '#f97316' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Vermelho', value: '#ef4444' },
]

const STORAGE_KEY = 'pareto-dashboard-hotspots'

export function useHotspots() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setHotspots(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const save = (updated: Hotspot[]) => {
    setHotspots(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch { /* ignore */ }
  }

  const addHotspot = (hotspot: Omit<Hotspot, 'id'>) => {
    save([...hotspots, { ...hotspot, id: Date.now().toString() }])
  }

  const removeHotspot = (id: string) => {
    save(hotspots.filter(h => h.id !== id))
  }

  return { hotspots, addHotspot, removeHotspot }
}
