import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Prose, Section } from '@/components/site/Prose'
import { POLICIES } from '@/content/policies'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = POLICIES.find((x) => x.slug === slug)
  return p ? { title: p.title, description: p.description, alternates: { canonical: `/policies/${p.slug}` } } : {}
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params
  const policy = POLICIES.find((x) => x.slug === slug)
  if (!policy) notFound()
  return (
    <Prose title={policy.title} intro={policy.description}>
      {policy.sections.map((s) => (
        <Section key={s.title} title={s.title}>{s.body}</Section>
      ))}
      <p className="mt-14 text-step--1 text-ink-muted">Last updated {policy.updated}.</p>
      <nav aria-label="Other policies" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-step--1">
        {POLICIES.filter((p) => p.slug !== policy.slug).map((p) => (
          <Link key={p.slug} href={`/policies/${p.slug}`} className="link">{p.title}</Link>
        ))}
      </nav>
    </Prose>
  )
}
