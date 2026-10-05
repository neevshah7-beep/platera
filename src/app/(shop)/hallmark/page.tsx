import type { Metadata } from 'next'
import { HallmarkPlate } from '@/components/pdp/HallmarkPlate'
import { Prose, Section } from '@/components/site/Prose'
import { JsonLd } from '@/lib/seo/jsonld'

export const metadata: Metadata = {
  title: 'How to Read a Silver Hallmark and Check a HUID',
  description:
    'What the BIS hallmark on 925 silver means, what a HUID is, and how to check it yourself in the BIS CARE app before you buy any jewellery.',
  alternates: { canonical: '/hallmark' },
}

const FAQ = [
  ['What does 925 mean?', '925 silver is 92.5% pure silver. The rest is usually copper, which makes the metal strong enough to hold its shape and its stones.'],
  ['What is a hallmark?', 'A mark stamped on the piece by a BIS-recognised assaying centre after testing its purity. It is the only independent proof of what the metal is.'],
  ['What is a HUID?', 'A six-character code, letters and numbers, unique to one piece. It links that piece to its hallmarking record.'],
  ['How do I check a HUID?', 'Install the BIS CARE app from the Play Store or App Store, choose “Verify HUID”, and enter the six characters. It shows the purity, the type of article and the hallmarking centre.'],
] as const

export default function HallmarkPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        }}
      />
      <Prose title="Reading a hallmark" intro="The hallmark is the one thing on a piece of jewellery that nobody selling it can change. Here is how to read it, and how to check it yourself.">
        <Section title="What you’ll see">
          <div className="py-2"><HallmarkPlate purity="925" huid="AB12CD" /></div>
          <p>The mark has up to three parts: the BIS mark, the purity (925 for sterling silver), and, where the piece carries one, a six-character HUID. The example above shows the layout; the code is illustrative.</p>
        </Section>
        {FAQ.map(([q, a]) => (
          <Section key={q} title={q}><p>{a}</p></Section>
        ))}
        <Section title="Silver and the HUID">
          <p>HUID-based hallmarking was extended to silver jewellery more recently than to gold, so you’ll find it on some silver pieces and not others. Where a Platera piece carries a HUID, it is printed on the piece’s page, so you can check it before you buy.</p>
        </Section>
      </Prose>
    </>
  )
}
