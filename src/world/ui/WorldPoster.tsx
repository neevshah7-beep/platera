'use client'

import { useXp } from '../state'

/**
 * The poster behind a page while the world loads: a posed render (also the LCP image),
 * fixed full-screen, giving way once the world has drawn its first frame.
 */
export function WorldPoster({ children }: { children: React.ReactNode }) {
  const ready = useXp((s) => s.ready)
  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 z-0 bg-ground transition-opacity duration-[1200ms] ease-[var(--ease-settle)] ${ready ? 'opacity-0' : 'opacity-100'}`}>
      {children}
    </div>
  )
}
