'use client'

import { useEffect, useState } from 'react'
import { duration } from '@tokens/motion'
import { ANCHORS, registry } from './registry'
import { ChamberRoom } from './rooms/ChamberRoom'
import { Cove } from './rooms/Cove'
import { HomeRoom } from './rooms/Home'
import { LampRoom } from './rooms/LampRoom'
import { QuietRoom } from './rooms/QuietRoom'
import { TrayRoom } from './rooms/TrayRoom'
import { useXp, xp, type RoomState } from './state'

const idOf = (r: RoomState) => (r.key === 'tray' || r.key === 'chamber' ? `${r.key}:${r.id}` : r.key === 'lamp' ? `lamp:${r.piece.slug}` : r.key)

/**
 * ROOM MOUNTING. The current room is mounted; the room being left stays mounted until
 * the camera has finished travelling (so the move is continuous), and a room adjacent to
 * the current one (the Tray behind the Lamp) stays so browser back dollies straight
 * into it. Everything else is unmounted and disposed. The canvas never remounts.
 */
export function Rooms() {
  const room = useXp((s) => s.room)
  const [mounted, setMounted] = useState<RoomState[]>([])

  useEffect(() => {
    setMounted((prev) => [...prev.filter((r) => r.key !== room.key), room])
    const t = setTimeout(() => {
      const now = xp.get().room
      const keep = registry.get(now.key)?.adjacent ?? []
      setMounted((prev) => prev.filter((r) => r.key === now.key || keep.includes(r.key)))
    }, duration.camera + 400)
    return () => clearTimeout(t)
  }, [room])

  const studio = mounted.some((r) => r.key === 'tray' || r.key === 'lamp')
  return (
    <>
      {studio && (
        <group position={ANCHORS.tray}>
          <Cove z={-4} depth={30} width={22} />
        </group>
      )}
      {mounted.map((r) => {
        const k = idOf(r)
        switch (r.key) {
          case 'home':
            return <HomeRoom key={k} data={r} />
          case 'tray':
            return <TrayRoom key={k} id={r.id} pieces={r.pieces} />
          case 'lamp':
            return <LampRoom key={k} piece={r.piece} />
          case 'chamber':
            return <ChamberRoom key={k} id={r.id} pieces={r.pieces} />
          default:
            return <QuietRoom key={k} />
        }
      })}
    </>
  )
}
