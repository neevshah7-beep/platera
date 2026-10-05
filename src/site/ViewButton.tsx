'use client'

import { useState } from 'react'
import { Viewing, type ViewingPiece } from './Viewing'

/** Opens The Viewing for a piece. */
export function ViewButton({ piece, label = 'Look closer', className = 'link font-medium' }: { piece: ViewingPiece; label?: string; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>
      <Viewing piece={open ? piece : null} onClose={() => setOpen(false)} />
    </>
  )
}
