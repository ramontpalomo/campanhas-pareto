'use client'

import { useState, useRef } from 'react'
import { Info } from 'lucide-react'

interface TooltipProps {
  text: string
  children: React.ReactNode
}

export function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (
    <span
      className="relative inline-flex items-center gap-1 cursor-default"
      onMouseEnter={() => { timeout.current = setTimeout(() => setVisible(true), 200) }}
      onMouseLeave={() => { if (timeout.current) clearTimeout(timeout.current); setVisible(false) }}
    >
      {children}
      {visible && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-xl leading-relaxed whitespace-normal">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  )
}

export function ColHeader({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <Tooltip text={tooltip}>
      <span>{label}</span>
      <Info className="w-3 h-3 text-gray-400 flex-shrink-0" />
    </Tooltip>
  )
}
