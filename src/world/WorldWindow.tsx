'use client'

import { useXp } from './state'

/** Shows its poster until the world has drawn its first frame, then reveals the 3D behind the page. */
export function WorldWindow({ poster, className = '' }: { poster: React.ReactNode; className?: string }) {
  const ready = useXp((s) => s.ready)
  return (
    <div className={`relative ${className}`}>
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[var(--dur-slow)] ease-[var(--ease-settle)] ${ready ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>{poster}</div>
    </div>
  )
}
