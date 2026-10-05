'use client'

import { useCallback, useState } from 'react'
import { FallScene } from '@/scenes/fall/FallScene'
import { HeroCopy } from '@/scenes/fall/HeroCopy'
import { StrandScene, type StrandPromise } from '@/scenes/strand/StrandScene'
import { EntryGate } from './EntryGate'

/** The homepage as a sequence of scenes. Scene 1 now; the strand, the stamp and the rest follow. */
export function HomeExperience({ line, collaboration, promises }: { line: string; collaboration: string; promises: StrandPromise[] }) {
  const [landed, setLanded] = useState(false)
  const onLanded = useCallback(() => setLanded(true), [])
  return (
    <>
      <EntryGate />
      <FallScene onLanded={onLanded}>
        <HeroCopy landed={landed} line={line} collaboration={collaboration} />
      </FallScene>
      <StrandScene promises={promises} />
    </>
  )
}
