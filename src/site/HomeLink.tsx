'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { scroller } from './SmoothScroll'

/** Home, from anywhere. On the homepage itself it glides back to the top. */
export function HomeLink({ className, children = 'Home' }: { className?: string; children?: React.ReactNode }) {
  const path = usePathname()
  return (
    <Link
      href="/"
      className={className}
      aria-current={path === '/' ? 'page' : undefined}
      onClick={(e) => {
        if (path !== '/') return
        e.preventDefault()
        if (scroller.lenis) scroller.lenis.scrollTo(0, { duration: 2.2 })
        else scrollTo({ top: 0, behavior: 'smooth' })
      }}
    >
      {children}
    </Link>
  )
}
