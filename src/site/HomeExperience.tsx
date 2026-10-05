'use client'

import { useCallback, useEffect, useState } from 'react'
import { FallScene } from '@/scenes/fall/FallScene'
import { HeroCopy } from '@/scenes/fall/HeroCopy'
import { CollectionScene } from '@/scenes/collection/CollectionScene'
import type { CollectionPiece } from '@/scenes/collection/collection'
import { StampScene } from '@/scenes/stamp/StampScene'
import { StrandScene, type StrandPromise } from '@/scenes/strand/StrandScene'
import { EntryGate } from './EntryGate'

/** The homepage as a sequence of scenes. Scene 1 now; the strand, the stamp and the rest follow. */
export function HomeExperience({ line, collaboration, promises, pieces, total }: { line: string; collaboration: string; promises: StrandPromise[]; pieces: (CollectionPiece & { href: string })[]; total: number }) {
  const [landed, setLanded] = useState(false)
  const onLanded = useCallback(() => setLanded(true), [])
  // While the hero wordmark is on screen, the header's small one would only repeat it.
  useEffect(() => {
    const on = () => (document.documentElement.dataset.hero = scrollY < innerHeight * 1.2 ? '1' : '0')
    on()
    addEventListener('scroll', on, { passive: true })
    return () => {
      removeEventListener('scroll', on)
      delete document.documentElement.dataset.hero
    }
  }, [])
  return (
    <>
      <EntryGate />
      <FallScene onLanded={onLanded}>
        <HeroCopy landed={landed} line={line} collaboration={collaboration} />
      </FallScene>
      <StrandScene promises={promises} />
      <StampScene />
      <CollectionScene pieces={pieces} total={total} />
    </>
  )
}
