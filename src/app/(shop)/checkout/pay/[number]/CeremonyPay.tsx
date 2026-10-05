'use client'

import { useCallback, useState } from 'react'
import { Ceremony } from '@/scenes/ceremony/Ceremony'
import type { PackPiece } from '@/scenes/ceremony/packing'
import { PayLauncher } from './PayLauncher'

/** The ceremony, then the payment: sealing the wax opens the secure payment window. */
export function CeremonyPay({
  ceremony,
  launcher,
}: {
  ceremony: { pieces: PackPiece[]; names: string[]; city: string; pincode: string; eta: string; total: string }
  launcher: Omit<React.ComponentProps<typeof PayLauncher>, 'openSignal'>
}) {
  const [signal, setSignal] = useState(0)
  const [sealed, setSealed] = useState(false)
  const onSealed = useCallback(() => {
    setSealed(true)
    setSignal((n) => n + 1)
  }, [])
  return (
    <>
      <Ceremony {...ceremony} onSealed={onSealed} />
      {/* Stands in for the page beneath the fixed stage. */}
      <div className="h-[calc(100svh-4rem)]" aria-hidden />
      <div className={sealed ? 'fixed bottom-6 left-1/2 z-40 w-[min(34rem,calc(100%-2*var(--gutter)))] -translate-x-1/2 text-center' : 'sr-only'}>
        <PayLauncher {...launcher} openSignal={signal} />
      </div>
    </>
  )
}
