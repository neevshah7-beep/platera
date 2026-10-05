'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { roomPath } from './route'
import { xp, type RoomState } from './state'

/**
 * Declares which room of the world this page stands in, and hands the room its data.
 * Rendered by pages (server components pass serialisable data). The canvas does not
 * remount; the camera travels to the room.
 */
export function Room({ state }: { state: RoomState }) {
  const path = usePathname()
  const json = JSON.stringify(state)
  useEffect(() => {
    roomPath.current = path
    xp.set({ room: JSON.parse(json) as RoomState, progress: 0 })
  }, [json, path])
  return null
}
