import type { Metadata } from 'next'
import { JsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld'
import { social } from '@/lib/seo/meta'
import { Prose, Section } from '@/components/site/Prose'

export const metadata: Metadata = social({
  title: 'Size Guide: Necklace, Chain and Payal Lengths',
  description: 'Where each necklace length sits, how to measure a payal at home, and how to read the lengths on Platera pieces. All measurements in inches.',
  alternates: { canonical: '/size-guide' },
})

const LENGTHS = [
  { in: 14, name: 'Choker', where: 'Close around the base of the neck' },
  { in: 16, name: 'Collar', where: 'At the base of the neck' },
  { in: 18, name: 'Princess', where: 'On the collarbone' },
  { in: 20, name: 'Matinee', where: 'Just below the collarbone' },
  { in: 24, name: 'Long', where: 'Above the bust' },
  { in: 30, name: 'Opera', where: 'At or below the bust' },
]

/** Where each length falls, drawn on a simple bust outline. Proportions are true to an average adult. */
function LengthDiagram() {
  const y = (inches: number) => 70 + (inches - 14) * 11.5
  return (
    <svg viewBox="0 0 320 380" role="img" aria-labelledby="len-title" className="w-full max-w-sm">
      <title id="len-title">Necklace lengths from 14 to 30 inches, drawn on a neck and shoulders</title>
      <path d="M130 0 V48 Q130 66 100 74 L20 100 Q4 106 2 130 V380 M190 0 V48 Q190 66 220 74 L300 100 Q316 106 318 130 V380" fill="none" stroke="var(--argent-shadow)" strokeWidth="1.5" />
      {LENGTHS.map((l) => {
        const yy = y(l.in)
        const spread = 40 + (l.in - 14) * 3.2
        return (
          <g key={l.in}>
            <path d={`M${160 - spread} ${Math.min(yy - 26, 66)} Q160 ${yy + 12} ${160 + spread} ${Math.min(yy - 26, 66)}`} fill="none" stroke="var(--argent)" strokeWidth="1" />
            <text x={160} y={yy + 6} textAnchor="middle" fontSize="11" fill="var(--ink-on-dark)" fontFamily="var(--font-satoshi)">{l.in}″</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function SizeGuidePage() {
  return (
    <>
    <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Size guide', path: '/size-guide' }])} />
    <Prose title="Size guide" intro="Every length on Platera is given in inches, measured end to end with the clasp closed.">
      <Section title="Necklaces and chains">
        <div className="grid gap-10 sm:grid-cols-2">
          <LengthDiagram />
          <table className="num w-full text-left text-step--1">
            <caption className="sr-only">Necklace lengths and where they sit</caption>
            <thead>
              <tr className="text-ink-muted"><th className="pb-2 font-normal">Length</th><th className="pb-2 font-normal">Sits</th></tr>
            </thead>
            <tbody>
              {LENGTHS.map((l) => (
                <tr key={l.in} className="border-t border-rule">
                  <td className="py-2 pr-4 text-ink">{l.in} in · {l.name}</td>
                  <td className="py-2">{l.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>The easiest way to choose: lay a necklace you already like flat, measure it end to end, and pick the nearest length.</p>
      </Section>
      <Section title="Payals">
        <p>Wrap a soft tape measure, or a strip of paper you then measure against a ruler, around your ankle just above the ankle bone, where the payal will sit. Add half an inch for a close fit or one inch for a looser one.</p>
        <p>Most adult payals are 10 to 11 inches. Ask us on WhatsApp for the exact length of any pair before you order.</p>
      </Section>
      <Section title="Earrings">
        <p>Each pair’s page gives its drop length and its weight per pair. Pairs above about eight grams are better for an evening than a full day.</p>
      </Section>
    </Prose>
    </>
  )
}
