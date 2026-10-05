'use client'

import { useEffect, useRef, type DependencyList, type RefObject } from 'react'
import { registerScene } from './manager'

type Disposable = { dispose: () => void }

/**
 * Puts a live WebGL scene under the scene manager. `host` is the element the canvas lives
 * in; every build gets a brand-new canvas (so a fresh WebGL context), and disposing removes
 * the canvas and releases its context at once, so GPU memory is genuinely returned.
 * A lost context (GPU pressure) disposes the scene and lets the manager rebuild it.
 */
export function useManagedScene<T extends Disposable>(
  section: RefObject<HTMLElement | null>,
  host: RefObject<HTMLDivElement | null>,
  build: (canvas: HTMLCanvasElement) => T,
  deps: DependencyList,
) {
  const api = useRef<T | null>(null)
  useEffect(() => {
    let reg: ReturnType<typeof registerScene> | null = null
    reg = registerScene(section.current!, () => {
      const h = host.current
      if (!h) return null
      const canvas = document.createElement('canvas')
      canvas.className = 'absolute inset-0 h-full w-full'
      canvas.setAttribute('aria-hidden', 'true')
      h.appendChild(canvas)
      const onLost = (e: Event) => {
        e.preventDefault()
        queueMicrotask(() => reg?.reset())
      }
      canvas.addEventListener('webglcontextlost', onLost)
      const a = build(canvas)
      api.current = a
      const ro = new ResizeObserver(() => (a as T & { resize?: () => void }).resize?.())
      ro.observe(canvas)
      return {
        dispose: () => {
          ro.disconnect()
          canvas.removeEventListener('webglcontextlost', onLost)
          if (api.current === a) api.current = null
          try {
            a.dispose()
          } catch {}
          const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
          gl?.getExtension('WEBGL_lose_context')?.loseContext()
          canvas.remove()
        },
      }
    })
    return () => reg?.unregister()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return api
}
