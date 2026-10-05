import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1440px] px-[var(--gutter)] py-32">
      <p className="num text-step--1 text-ink-muted">404</p>
      <h1 className="mt-3 text-step-6">That page isn’t on the tray.</h1>
      <p className="measure mt-6 text-step-1 text-ink-muted">
        It may have moved, or the address may be mistyped. Pieces that sell stay on the site, so if you followed a link to a piece, it may have been renamed.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/collection" className="btn btn-primary">View the collection</Link>
        <Link href="/" className="btn btn-quiet">Go to the home page</Link>
      </div>
    </div>
  )
}
