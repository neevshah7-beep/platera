import { siteUrl, whatsappLink } from '@/lib/store'

/**
 * Selling happens on WhatsApp. Each message carries the piece's name, its reference and the
 * link to its page; WhatsApp unfurls that link into a card with the piece's photograph, so
 * the counter sees at a glance which piece is meant.
 */
type Ref = { name: string; sku: string; slug: string }

const page = (p: Ref) => siteUrl(`/piece/${p.slug}`)

export const buyOnWhatsApp = (p: Ref) => whatsappLink(`Hello Platera, I would like to buy this piece.\n\n${p.name} (${p.sku})\n${page(p)}`)

export const priceOnWhatsApp = (p: Ref) => whatsappLink(`Hello Platera, could you tell me the price of this piece?\n\n${p.name} (${p.sku})\n${page(p)}`)

/** What stands where a price used to: sold, or an invitation to ask. */
export const PRICE_ON_REQUEST = 'Price on WhatsApp'
