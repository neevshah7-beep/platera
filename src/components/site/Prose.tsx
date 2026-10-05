/** Long-form page frame: a heading column and a measured text column, the editorial layout used by every content page. */
export function Prose({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[1440px] gap-12 px-[var(--gutter)] pt-12 md:grid-cols-12">
      <header className="md:col-span-4">
        <h1 className="text-step-6">{title}</h1>
        {intro && <p className="measure mt-6 text-step-1 text-ink-muted">{intro}</p>}
      </header>
      <div className="prose-body md:col-span-7 md:col-start-6">{children}</div>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-rule pt-8 [&+&]:mt-14">
      <h2 className="text-step-3">{title}</h2>
      <div className="measure mt-4 space-y-4 text-ink-muted [&_strong]:font-medium [&_strong]:text-ink">{children}</div>
    </section>
  )
}
