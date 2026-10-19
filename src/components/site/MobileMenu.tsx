'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/necklaces', label: 'Necklaces' },
  { href: '/payals', label: 'Payals' },
  { href: '/earrings', label: 'Earrings' },
  { href: '/rings', label: 'Rings' },
  { href: '/mangalsutras', label: 'Mangalsutras' },
  { href: '/collection', label: 'The whole collection' },
  { href: '/appointment', label: 'Book a viewing' },
  { href: '/visit', label: 'Visit the store' },
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <>
      <button
        type="button"
        className="lg:hidden"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Menu
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-ground p-0 text-ink backdrop:bg-ground/80"
        aria-label="Menu"
      >
        <div className="flex h-16 items-center justify-between px-[var(--gutter)]">
          <span className="font-display text-step-2">Platera</span>
          <button type="button" onClick={() => setOpen(false)} className="text-step--1">
            Close
          </button>
        </div>
        <nav aria-label="Menu" className="px-[var(--gutter)] pt-6">
          <ul className="space-y-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link prefetch={false} href={l.href} className="block border-b border-rule py-4 font-display text-step-3">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </dialog>
    </>
  )
}
