'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { scroller } from './SmoothScroll'

const KEY_Y = 'platera:home-y'
const KEY_RETURN = 'platera:return'

/**
 * Leaving the homepage remembers where you were; on any other page a small button takes
 * you back to the house at exactly that point, so the walk continues where it paused.
 */
export function BackToHouse() {
  const path = usePathname()
  const router = useRouter()

  // On the homepage: remember the position as you go, and restore it when returning.
  useEffect(() => {
    if (path !== '/') return
    let restore: number | null = null
    try {
      if (sessionStorage.getItem(KEY_RETURN) === '1') restore = Number(sessionStorage.getItem(KEY_Y) ?? 0)
      sessionStorage.removeItem(KEY_RETURN)
    } catch {}
    let poll = 0
    if (restore) {
      // Wait until the homepage is laid out (tall enough) and smooth scroll is running,
      // then glide the last stretch rather than jump.
      const y = restore
      const t0 = performance.now()
      const tryRestore = () => {
        const tall = document.documentElement.scrollHeight >= y + innerHeight
        if ((tall && scroller.lenis) || performance.now() - t0 > 4000) {
          if (scroller.lenis) {
            scroller.lenis.resize()
            scroller.lenis.scrollTo(Math.max(0, y - innerHeight * 0.6), { immediate: true, force: true })
            scroller.lenis.scrollTo(y, { duration: 1.2, force: true })
          } else scrollTo(0, y)
          return
        }
        poll = window.setTimeout(tryRestore, 80)
      }
      poll = window.setTimeout(tryRestore, 80)
    }
    let t = 0
    const save = () => {
      clearTimeout(t)
      t = window.setTimeout(() => {
        try {
          sessionStorage.setItem(KEY_Y, String(Math.round(scrollY)))
        } catch {}
      }, 150)
    }
    addEventListener('scroll', save, { passive: true })
    return () => {
      removeEventListener('scroll', save)
      clearTimeout(t)
      clearTimeout(poll)
    }
  }, [path])

  // Out of the way at the top of a page (where Home is in the header and the page's own
  // buttons are); it appears once you are reading further down, tucking away while you
  // scroll down and returning on the way up.
  const [tucked, setTucked] = useState(true)
  useEffect(() => {
    let last = scrollY
    setTucked(scrollY < innerHeight * 0.7)
    const on = () => {
      const d = scrollY - last
      if (scrollY < innerHeight * 0.7) setTucked(true)
      else if (Math.abs(d) > 6) setTucked(d > 0)
      last = scrollY
    }
    addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [path])

  if (path === '/' || path.startsWith('/checkout') || path.startsWith('/order')) return null
  return (
    <button
      type="button"
      className="back-house"
      data-tucked={tucked}
      onClick={() => {
        try {
          sessionStorage.setItem(KEY_RETURN, '1')
        } catch {}
        router.push('/')
      }}
    >
      <span className="back-house-arrow" aria-hidden>←</span>
      Back to the house
    </button>
  )
}
