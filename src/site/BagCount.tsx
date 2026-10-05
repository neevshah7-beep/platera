'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/** The bag symbol's count: ticks up the moment a piece lands (flyToBag), then syncs with the server. */
export function BagCount({ initial }: { initial: number }) {
  const [n, setN] = useState(initial)
  const [bump, setBump] = useState(0)
  const router = useRouter()
  useEffect(() => setN(initial), [initial])
  useEffect(() => {
    const on = () => {
      setTimeout(() => {
        setN((v) => v + 1)
        setBump((b) => b + 1)
      }, 1150)
      setTimeout(() => router.refresh(), 1600)
    }
    addEventListener('platera:bag-added', on)
    return () => removeEventListener('platera:bag-added', on)
  }, [router])
  if (n <= 0) return null
  return <span key={bump} className="num bag-count" aria-hidden>{n}</span>
}
