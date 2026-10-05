'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/** The bag link's count: ticks up the moment a piece lands (flyToBag), then syncs with the server. */
export function BagCount({ initial }: { initial: number }) {
  const [n, setN] = useState(initial)
  const router = useRouter()
  useEffect(() => setN(initial), [initial])
  useEffect(() => {
    const on = () => {
      setTimeout(() => setN((v) => v + 1), 1150)
      setTimeout(() => router.refresh(), 1600)
    }
    addEventListener('platera:bag-added', on)
    return () => removeEventListener('platera:bag-added', on)
  }, [router])
  return <span className="num ml-1.5">({n})</span>
}
