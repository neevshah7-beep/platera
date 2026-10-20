'use client'

import { useEffect, useState } from 'react'

type Stats = { fps: number; low: number; worst: number; chapter: string; gpu: string; dpr: string; mem: string; cores: string; size: string }

/**
 * A hidden speed meter for checking the site on a real phone: open any page with ?perf
 * in the address (it stays on for the visit). Shows frames per second over the last two
 * seconds, the slowest 1% of frames, the worst frame, the chapter on screen and the
 * device's GPU, so a screenshot says where a phone struggles.
 */
export function PerfMeter() {
  const [on, setOn] = useState(false)
  const [s, setS] = useState<Stats | null>(null)

  useEffect(() => {
    try {
      if (new URLSearchParams(location.search).has('perf')) sessionStorage.setItem('platera:perf', '1')
      setOn(sessionStorage.getItem('platera:perf') === '1')
    } catch {}
  }, [])

  useEffect(() => {
    if (!on) return
    let gpu = 'unknown'
    try {
      const gl = document.createElement('canvas').getContext('webgl2')
      const ext = gl?.getExtension('WEBGL_debug_renderer_info')
      if (gl && ext) gpu = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {}
    const nav = navigator as Navigator & { deviceMemory?: number }
    const frames: number[] = []
    let last = performance.now()
    let raf = 0
    let tick = 0
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      frames.push(now - last)
      last = now
      while (frames.length > 120) frames.shift()
      if (++tick % 15) return
      const sorted = [...frames].sort((a, b) => a - b)
      const avg = frames.reduce((a, b) => a + b, 0) / frames.length
      const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('section')
      setS({
        fps: Math.round(1000 / avg),
        low: Math.round(1000 / (sorted[Math.floor(sorted.length * 0.99)] ?? avg)),
        worst: Math.round(sorted.at(-1) ?? 0),
        chapter: el?.id || el?.getAttribute('aria-label') || '-',
        gpu: gpu.replace(/\(.*?\)/g, '').slice(0, 42),
        dpr: devicePixelRatio.toFixed(2),
        mem: nav.deviceMemory ? `${nav.deviceMemory} GB` : '?',
        cores: String(navigator.hardwareConcurrency ?? '?'),
        size: `${innerWidth}x${innerHeight}`,
      })
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [on])

  if (!on || !s) return null
  const tone = s.fps >= 50 ? '#2f7d3a' : s.fps >= 30 ? '#a8741a' : '#b3261e'
  return (
    <div
      aria-hidden
      style={{ position: 'fixed', left: 8, bottom: 8, zIndex: 9999, padding: '8px 10px', background: 'rgba(255,253,248,0.95)', border: `2px solid ${tone}`, borderRadius: 6, font: '600 11px/1.45 system-ui, sans-serif', color: '#2b1d0e', pointerEvents: 'none', maxWidth: '78vw' }}
    >
      <div style={{ color: tone, fontSize: 14 }}>{s.fps} fps · low {s.low} · worst {s.worst} ms</div>
      <div>{s.chapter}</div>
      <div>{s.gpu}</div>
      <div>dpr {s.dpr} · {s.mem} · {s.cores} cores · {s.size}</div>
    </div>
  )
}
