import type { Metadata } from 'next'
import { Prose, Section } from '@/components/site/Prose'
import { STORE, whatsappLink } from '@/lib/store'
import { EnquiryForm } from './EnquiryForm'

export const metadata: Metadata = {
  title: 'Made to Order Silver Jewellery',
  description: `Send Platera a design or a reference and we’ll make it in 925 sterling silver. Price confirmed before work begins; ready in ${STORE.madeToOrderDays}.`,
  alternates: { canonical: '/custom' },
}

const STEPS = [
  'Send us the design: a photograph, a sketch, or a piece from this site you’d like changed.',
  'We tell you what it will take and confirm the price, worked out the same way as every other piece.',
  'You pay, and work begins.',
  `The piece is made, which takes ${STORE.madeToOrderDays}.`,
  'We send it to you, or you collect it from the store.',
]

export default function CustomPage() {
  return (
    <Prose title="Made to order" intro="If the piece you want isn’t on the tray, we can have it made in 925 sterling silver.">
      <Section title="How it works">
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s} className="grid grid-cols-[2rem_1fr]">
              <span className="num text-ink">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <p>Made-to-order pieces can’t be returned except for a defect, so we agree every detail with you first.</p>
      </Section>
      <Section title="The quickest way">
        <p>Send the design on WhatsApp. Photographs are easiest there.</p>
        <a className="btn btn-primary" href={whatsappLink('Hello Platera, I’d like something made to order. Here is the design:')}>
          Start on WhatsApp
        </a>
      </Section>
      <Section title="Or write to us here">
        <EnquiryForm kind="CUSTOM_ORDER" />
      </Section>
    </Prose>
  )
}
