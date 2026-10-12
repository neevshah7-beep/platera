import type { Metadata } from 'next'
import { social } from '@/lib/seo/meta'
import { HouseScene } from '@/scenes/house/HouseScene'
import Link from 'next/link'
import { Prose, Section } from '@/components/site/Prose'
import { STORE } from '@/lib/store'

export const metadata: Metadata = social({
  title: 'About Platera: Curated 925 Silver Jewellery',
  description:
    'Platera is a curated house. Every piece is chosen for its metal, its making and its design, and presented in collaboration with Bhairav Jewellers, Gorai 1.',
  alternates: { canonical: '/about' },
})

export default function AboutPage() {
  return (
    <>
    <HouseScene id="about-house" />
    <Prose title="How Platera works" intro="A small house with one idea: choose fewer pieces, choose them properly, and show the customer everything.">
      <Section title="We choose; we don’t make">
        <p>
          Platera isn’t a manufacturer, and doesn’t pretend to be. What it has is an eye and a counter. Every piece is selected for its
          quality, its craftsmanship and its design, and presented online in collaboration with Bhairav Jewellers in Gorai 1, Borivali West.
        </p>
        <p>
          Choosing is the work. A tray of silver can look alike from across a room; up close, one piece has stones set level and a clasp
          that will last, and the next doesn’t. We turn every piece over, because the back of a piece tells you more than the front.
        </p>
      </Section>
      <Section title="Why 925 silver, hallmarked">
        <p>
          Everything in the house today is 925 sterling silver and BIS hallmarked. Silver is honest metal: it is priced by weight, it can be
          tested, and it lasts if it’s cared for. The hallmark means you don’t have to take our word for the purity.
        </p>
      </Section>
      <Section title="Why we show you the working">
        <p>
          The jewellers people trust are the ones who open the book: the weight, the day’s rate, the making charge, the tax, each on its own line. Every price we send does that.
          A single number with nothing behind it asks for trust; a breakdown earns it.
        </p>
        <p><Link href="/collection" className="link text-ink">See the collection</Link> and ask the price of any piece on WhatsApp.</p>
      </Section>
      <Section title="Why it ends with a person">
        <p>
          Choose a piece here and send it to us on WhatsApp; that is the whole of buying. If you’d rather see it first, book a time at the store or a video
          call, or message us on WhatsApp. Someone at <span className="num">{STORE.phoneDisplay}</span> will answer.
        </p>
      </Section>
    </Prose>
    </>
  )
}
