'use client'

import { track } from '@/lib/analytics/client'
import { useWorld, world, type Mood } from './store'

const MOODS: { id: Mood; label: string; hint: string }[] = [
  { id: 'studio', label: 'The lamp', hint: 'How we light it at the store' },
  { id: 'daylight', label: 'Daylight', hint: 'By a window, late morning' },
  { id: 'diya', label: 'Diya', hint: 'By the flame of an oil lamp' },
  { id: 'evening', label: 'Evening', hint: 'Warm room light at a party' },
  { id: 'mandap', label: 'Mandap', hint: 'Under marigold and rose light' },
]

/** Light Moods: see the piece in the light of the occasion. Shown only when the 3D house is running. */
export function LightMoods({ slug }: { slug: string }) {
  const mood = useWorld((s) => s.mood)
  return (
    <fieldset className="[html[data-world=off]_&]:hidden">
      <legend className="text-step--1 text-ink-muted">See it in the light of the occasion</legend>
      <div role="radiogroup" className="mt-3 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mood === m.id}
            title={m.hint}
            onClick={() => {
              world.set({ mood: m.id })
              track('light_mood_changed', { mood: m.id, piece: slug })
            }}
            className={`min-h-10 border px-3 text-step--1 transition-colors duration-[var(--dur-calm)] ${mood === m.id ? 'border-argent text-ink' : 'border-rule text-ink-muted hover:text-ink'}`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
