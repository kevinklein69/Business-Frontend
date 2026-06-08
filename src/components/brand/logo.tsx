'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Betrieb-App brand mark — a progress/clock ring (time) enclosing stacked task
 * blocks (work) with a checkmark (done). Pure SVG, scales crisply to any size.
 * Colours are baked to the brand palette so the mark stays consistent on light
 * and dark surfaces alike.
 */
export function LogoMark({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  // Unique gradient id per instance — avoids duplicate-id collisions when more
  // than one mark renders in the same document (e.g. login desktop + mobile).
  const uid = useId()
  const grad = `ba-grad-${uid}`

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Betrieb-App"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b263b" />
          <stop offset="1" stopColor="#415a77" />
        </linearGradient>
      </defs>

      {/* Badge */}
      <rect width="48" height="48" rx="12" fill={`url(#${grad})`} />
      {/* On dark surfaces (#1b263b sidebar/panel) the navy badge edge would melt
          into the background — a hairline keeps the tile readable. */}
      {onDark && (
        <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="11.25" fill="none" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="1.5" />
      )}

      {/* Clock / progress ring: faint full track + ~75% bright arc */}
      <circle cx="24" cy="24" r="13.5" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="2.4" />
      <circle
        cx="24"
        cy="24"
        r="13.5"
        stroke="#8fb0cf"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="63.6 21.2"
        transform="rotate(-90 24 24)"
      />

      {/* Done check + stacked task blocks */}
      <path d="M17.6 20.3l2 2 3.4-3.7" stroke="#e0e1dd" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="25.5" y="19.6" width="5" height="2.5" rx="1.25" fill="#e0e1dd" fillOpacity="0.85" />
      <rect x="18" y="24" width="12" height="2.5" rx="1.25" fill="#e0e1dd" />
      <rect x="18" y="27.8" width="8" height="2.5" rx="1.25" fill="#e0e1dd" fillOpacity="0.6" />
    </svg>
  )
}

/** Mark + "Betrieb-App" wordmark. */
export function Logo({
  className,
  markClassName,
  textClassName,
  onDark = false,
}: {
  className?: string
  markClassName?: string
  textClassName?: string
  onDark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <LogoMark onDark={onDark} className={cn('size-8 shrink-0', markClassName)} />
      <span className={cn('font-semibold tracking-tight', textClassName)}>Betrieb-App</span>
    </span>
  )
}
