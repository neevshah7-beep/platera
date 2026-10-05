import { WorldStation } from '@/components/world/WorldStation'
import type { TrayPiece as PieceRef } from '@/world/state'

/**
 * The top of a collection page: you stand at the head of the long tray. Scrolling
 * this section walks the camera along it; pointing at a piece moves the lamp onto it;
 * clicking opens it. The list below repeats every piece as plain links and photos.
 */
export function RoomIntro({
  roomKey,
  pieces,
  title,
  summary,
}: {
  roomKey: string
  pieces: PieceRef[]
  title: string
  summary: string
}) {
  const height = Math.max(150, Math.min(420, pieces.length * 18))
  return (
    <>
      <WorldStation station={{ kind: 'room', key: roomKey, pieces }} />
      <section data-world-section="0" className="over-world relative" style={{ minHeight: `${height}svh` }}>
        <div className="sticky top-16 mx-auto flex min-h-[calc(100svh-4rem)] max-w-[1440px] flex-col justify-between px-[var(--gutter)] py-10">
          <div className="max-w-xl">
            <h1 className="text-step-6">{title}</h1>
            <p className="measure mt-4 text-step-1 text-ink-muted">{summary}</p>
          </div>
          <p className="text-step--1 text-ink-muted">
            Scroll to walk along the tray. Point at a piece to bring the lamp over it; choose one to open it.{' '}
            <a href="#list" className="link text-ink">Or see them as a list</a>.
          </p>
        </div>
      </section>
    </>
  )
}
