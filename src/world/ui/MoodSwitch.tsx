'use client'

import { track } from '@/lib/analytics/client'
import { useXp, xp, type Mood } from '../state'

const MOODS: { id: Mood; label: string }[] = [
  { id: 'studio', label: 'The lamp' },
  { id: 'daylight', label: 'Daylight' },
  { id: 'diya', label: 'Diya' },
  { id: 'evening', label: 'Evening' },
  { id: 'mandap', label: 'Mandap' },
]

/** Light Moods: relight the whole hall for an occasion. */
export function MoodSwitch({ className = '' }: { className?: string }) {
  const mood = useXp((s) => s.mood)
  const ready = useXp((s) => s.ready)
  if (!ready) return null
  return (
    <div role="radiogroup" aria-label="Light the hall by" className={`flex flex-wrap gap-2 ${className}`}>
      {MOODS.map((m) => (
        <button
          key={m.id}
          type="button"
          role="radio"
          aria-checked={mood === m.id}
          onClick={() => {
            xp.set({ mood: m.id })
            track('light_mood_changed', { mood: m.id, piece: 'home' })
          }}
          className={`min-h-10 rounded-full border px-4 text-step--1 backdrop-blur-md transition-colors duration-[var(--dur-calm)] ${
            mood === m.id ? 'border-ink bg-ink text-ground' : 'border-rule-light bg-ground/70 text-ink hover:border-ink'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
