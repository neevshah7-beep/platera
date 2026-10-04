import Link from 'next/link'
import { STORE } from '@/lib/store'

/**
 * Policy drafts, written from the client's decisions (docs/CLIENT_DECISIONS.md).
 * They are drafts: a lawyer should review them before launch. Items still open with
 * the client are written conservatively and noted in BUILD_NOTES.md.
 */
export type Policy = { slug: string; title: string; description: string; updated: string; sections: { title: string; body: React.ReactNode }[] }

const UPDATED = '5 October 2026'
const S = STORE

export const POLICIES: Policy[] = [
  {
    slug: 'shipping',
    title: 'Shipping and delivery',
    description: 'How Platera delivers across India: courier, timings, what to check on arrival, and what to do if a parcel arrives opened.',
    updated: UPDATED,
    sections: [
      {
        title: 'Where we deliver',
        body: <p>We deliver to serviceable PIN codes across India by courier. Checkout tells you if your PIN code is covered before you pay.</p>,
      },
      {
        title: 'When it leaves, and when it arrives',
        body: (
          <>
            <p>Pieces in stock are packed and handed to the courier after your payment is confirmed. You’ll receive the tracking number by email and WhatsApp as soon as it leaves the store.</p>
            <p>Delivery time depends on the courier and your destination. The estimate shown at checkout comes from the courier for your PIN code.</p>
            <p>Made-to-order pieces are dispatched once they are ready, usually {S.madeToOrderDays} after the price is confirmed and paid.</p>
          </>
        ),
      },
      {
        title: 'Receiving your parcel',
        body: (
          <>
            <p>The courier may ask to see a photo ID. Please check that the outer seal is intact before you accept the parcel.</p>
            <p><strong>If the parcel looks opened or damaged, don’t accept it.</strong> Refuse delivery and call us on <a className="link num text-ink" href={`tel:${S.phoneE164}`}>{S.phoneDisplay}</a>. If you have already accepted it, record a video while opening it and contact us within 24 hours.</p>
          </>
        ),
      },
      { title: 'Delivery charges', body: <p>Any delivery charge is shown at checkout before you pay. There are no charges on delivery.</p> },
      { title: 'Payment', body: <p>All orders are prepaid. Cash on delivery is not offered.</p> },
    ],
  },
  {
    slug: 'returns',
    title: 'Returns and refunds',
    description: `Returns within ${S.returnWindowDays} days. How refunds on silver jewellery are valued, and what is not refundable.`,
    updated: UPDATED,
    sections: [
      {
        title: 'The return window',
        body: <p>You may request a return within <strong>{S.returnWindowDays} days of delivery</strong>. Message us on WhatsApp or call us with your order number, and we’ll arrange the return.</p>,
      },
      {
        title: 'How a refund is valued',
        body: (
          <>
            <p>Most of our pieces are priced by the day’s metal rate, so a return is valued the same way.</p>
            <p><strong>Live-rate pieces</strong> are refunded at the metal rate on the day the return is accepted. If the rate has risen since you bought, the metal is refunded at the value you paid; it is never refunded above it.</p>
            <p><strong>Fixed-price pieces</strong> are refunded at the price paid, less GST.</p>
            <p><strong>Making charges, GST and other applicable charges are not refunded</strong> on any return. Each piece’s page shows these lines separately, so you can see what a return would give back before you buy.</p>
          </>
        ),
      },
      {
        title: 'Condition',
        body: (
          <>
            <p>The piece must come back in the condition it was sent, with every component: earrings with their backs, the box, the pouch and any certificate.</p>
            <p>A piece that comes back damaged, altered, incomplete, or with anything missing after delivery cannot be returned or refunded.</p>
            <p>This does not affect your rights if a piece arrives damaged, defective or not as described. In that case contact us within 24 hours of delivery and we will replace or refund it in full.</p>
          </>
        ),
      },
      {
        title: 'Earrings',
        body: <p>For hygiene reasons, earrings, including the earrings in a set, can be returned only if they are unworn, with their backs and seal intact. Each such piece says so on its page and again at checkout.</p>,
      },
      {
        title: 'Pieces that can’t be returned',
        body: <p>Made-to-order pieces, and any piece altered or resized at your request, cannot be returned except for a defect.</p>,
      },
      {
        title: 'When the refund arrives',
        body: <p>Once the returned piece has reached us and been checked, the refund is issued to your original payment method within 2 working days and usually appears in your account 5–7 working days after that.</p>,
      },
    ],
  },
  {
    slug: 'buyback',
    title: 'Buyback and exchange',
    description: 'How Platera values silver jewellery for buyback and exchange.',
    updated: UPDATED,
    sections: [
      {
        title: 'Buyback',
        body: (
          <>
            <p>We buy back pieces bought from Platera under our buyback policy. The value is based on the metal’s weight and the day’s rate, less a deduction. Ask us for the current deduction before you bring a piece in; we tell you the figure in advance.</p>
            <p><strong>Making charges, GST and other applicable charges are not included</strong> in any buyback value.</p>
          </>
        ),
      },
      {
        title: 'Exchange',
        body: <p>A piece can’t simply be exchanged at its current silver value. Exchanges are assessed under the same policy as buyback, and we’ll give you the figure in writing before anything is agreed.</p>,
      },
      {
        title: 'Condition',
        body: <p>Buyback and exchange are not available for pieces that are damaged, altered, incomplete or missing components.</p>,
      },
    ],
  },
  {
    slug: 'cancellation',
    title: 'Cancellation',
    description: 'How to cancel an order with Platera, and when an order can no longer be cancelled.',
    updated: UPDATED,
    sections: [
      {
        title: 'Before dispatch',
        body: <p>You can cancel an in-stock order any time before it is dispatched. Message or call us with your order number. The full amount is refunded to your original payment method.</p>,
      },
      { title: 'After dispatch', body: <p>Once an order has left the store it can’t be cancelled, but it can be returned under our <Link className="link text-ink" href="/policies/returns">returns policy</Link>.</p> },
      { title: 'Made-to-order pieces', body: <p>Made-to-order work begins once the price is agreed and paid, and it can’t be cancelled after that.</p> },
      { title: 'If we cancel', body: <p>If a one-of-one piece sells to another customer moments before your payment completes, we cancel your order and refund you in full automatically. We’ll tell you at once.</p> },
    ],
  },
  {
    slug: 'payments',
    title: 'Payments',
    description: 'How payment works on Platera: UPI, cards and net banking through Razorpay. Prepaid only.',
    updated: UPDATED,
    sections: [
      { title: 'How you pay', body: <p>Payments are taken by Razorpay, a payment gateway regulated in India, by UPI, debit and credit card, net banking and wallets. We never see or store your card or bank details.</p> },
      { title: 'Prepaid only', body: <p>Cash on delivery is not offered.</p> },
      { title: 'The amount', body: <p>The amount you pay is calculated by our server from the day’s rate and shown to you before payment. If the rate changes while a piece is in your bag, we show you the new price before you can pay.</p> },
      { title: 'Invoices', body: <p>Every order is invoiced by {S.legalName}, GSTIN <span className="num">{S.gstin}</span>, with GST shown separately.</p> },
      { title: 'Failed payments', body: <p>If money leaves your account but the order isn’t confirmed, the payment is returned automatically by Razorpay, usually within 5–7 working days. Call us and we’ll check it for you.</p> },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy',
    description: 'What personal information Platera collects, why, and how to ask for it to be deleted.',
    updated: UPDATED,
    sections: [
      { title: 'What we collect', body: <p>Your name, phone number, email and delivery address when you order, book a viewing or send an enquiry, and the pieces you ordered. Payment details are handled by Razorpay and never reach us.</p> },
      { title: 'Why', body: <p>To deliver your order, issue the invoice, arrange viewings, answer your questions, and send you updates about your order by email and WhatsApp.</p> },
      { title: 'Measurement', body: <p>If you allow it, we use Google Analytics and the Meta Pixel to understand which pages are useful. If you choose “only essential”, these don’t set cookies. We don’t sell your information.</p> },
      { title: 'Who else sees it', body: <p>Only the services needed to complete your order: Razorpay for payment, the courier for delivery, and our email and WhatsApp providers for messages.</p> },
      { title: 'Your rights', body: <p>You can ask to see, correct or delete your information at any time by messaging <a className="link num text-ink" href={`tel:${S.phoneE164}`}>{S.phoneDisplay}</a>. We keep invoices for as long as tax law requires.</p> },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of sale',
    description: 'The terms on which Platera Jewellers sells jewellery online.',
    updated: UPDATED,
    sections: [
      { title: 'Who you are buying from', body: <p>Platera Jewellers is presented in collaboration with Bhairav Jewellers, Gorai 1. Orders are accepted, fulfilled and invoiced by {S.legalName}, {S.address.line1}, {S.address.line2}, {S.address.city} {S.address.postalCode}, GSTIN <span className="num">{S.gstin}</span>.</p> },
      { title: 'Prices', body: <p>Live-rate pieces are priced from the day’s metal rate, the piece’s weight, its making charge and GST, each shown on the piece’s page. The price you pay is the one shown at checkout. A contract is formed when your payment is confirmed.</p> },
      { title: 'Weight', body: <p>The weight shown for a piece is the weighed weight of that piece. No weight tolerance applies.</p> },
      { title: 'Materials', body: <p>Every piece is described with its metal, purity and stones. Cubic zirconia is always named as such. Hallmarked pieces carry a BIS hallmark.</p> },
      { title: 'Returns, buyback and cancellation', body: <p>See the <Link className="link text-ink" href="/policies/returns">returns</Link>, <Link className="link text-ink" href="/policies/buyback">buyback</Link> and <Link className="link text-ink" href="/policies/cancellation">cancellation</Link> policies, which form part of these terms.</p> },
      { title: 'Disputes', body: <p>Please contact us first; most things are settled with a phone call. These terms are governed by the laws of India, and the courts at Mumbai have jurisdiction.</p> },
    ],
  },
]
