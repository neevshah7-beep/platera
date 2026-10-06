'use client'

import { useCallback, useEffect, useState } from 'react'
import { FallScene } from '@/scenes/fall/FallScene'
import { HeroCopy } from '@/scenes/fall/HeroCopy'
import { CollectionScene } from '@/scenes/collection/CollectionScene'
import type { CollectionPiece } from '@/scenes/collection/collection'
import { SittingScene } from '@/scenes/sitting/SittingScene'
import { HouseScene } from '@/scenes/house/HouseScene'
import { JourneyScene } from '@/scenes/journey/JourneyScene'
import { GiftScene } from '@/scenes/gift/GiftScene'
import { StampScene } from '@/scenes/stamp/StampScene'
import { VisitScene } from '@/scenes/visit/VisitScene'
import { StrandScene, type StrandPromise } from '@/scenes/strand/StrandScene'
import { ChapterRail } from './ChapterRail'
import { EntryGate } from './EntryGate'

/** The homepage as a sequence of scenes. Scene 1 now; the strand, the stamp and the rest follow. */
export function HomeExperience({ line, collaboration, promises, pieces, total, visit }: { line: string; collaboration: string; promises: StrandPromise[]; pieces: (CollectionPiece & { href: string })[]; total: number; visit: React.ComponentProps<typeof VisitScene> }) {
  const [landed, setLanded] = useState(false)
  const onLanded = useCallback(() => setLanded(true), [])
  // While the hero wordmark is on screen, the header's small one would only repeat it.
  useEffect(() => {
    // Written only when it changes: touching the attribute on every scroll event restyles the page.
    const d = document.documentElement.dataset
    const on = () => {
      const v = scrollY < innerHeight * 1.2 ? '1' : '0'
      if (d.hero !== v) d.hero = v
    }
    on()
    addEventListener('scroll', on, { passive: true })
    return () => {
      removeEventListener('scroll', on)
      delete document.documentElement.dataset.hero
    }
  }, [])
  return (
    // The homepage runs full-bleed under the header.
    <div className="home-chapters -mt-16">
      <EntryGate />
      <ChapterRail
        chapters={[
          { id: 'chapter-fall', label: 'The fall' },
          { id: 'chapter-promises', label: 'Six promises' },
          { id: 'chapter-hallmark', label: 'The hallmark' },
          { id: 'chapter-collection', label: 'The collection' },
          { id: 'chapter-sitting', label: 'The sitting' },
          { id: 'chapter-gift', label: 'The gift' },
          { id: 'chapter-house', label: 'The house' },
          { id: 'chapter-journey', label: 'The journey' },
          { id: 'chapter-counter', label: 'The counter' },
        ]}
      />
      <FallScene onLanded={onLanded}>
        <HeroCopy landed={landed} line={line} collaboration={collaboration} />
      </FallScene>
      <StrandScene promises={promises} />
      <StampScene />
      <CollectionScene pieces={pieces} total={total} />
      <SittingScene />
      <GiftScene />
      <HouseScene />
      <JourneyScene />
      <VisitScene {...visit} />
    </div>
  )
}
