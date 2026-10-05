import 'server-only'
import { Resend } from 'resend'
import { STORE } from '@/lib/store'

/**
 * Transactional email. One layout, set like the site: velvet type on ivory, a
 * hairline, the facts in a ledger table. Plain-text alternative always included.
 */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export type EmailContent = {
  subject: string
  heading: string
  paragraphs: string[]
  rows?: [string, string][]
  cta?: { label: string; href: string }
}

export function renderEmail(c: EmailContent): { html: string; text: string } {
  const rows = (c.rows ?? [])
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 0;border-top:1px solid #d8d1c4;color:#655e55">${esc(k)}</td><td style="padding:10px 0;border-top:1px solid #d8d1c4;text-align:right;font-variant-numeric:tabular-nums">${esc(v)}</td></tr>`,
    )
    .join('')
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f4efe7;color:#1c1b19;font-family:Georgia,serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe7"><tr><td align="center" style="padding:40px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="font-size:26px;padding-bottom:28px">Platera</td></tr>
<tr><td style="border-top:1px solid #1c1b19;padding-top:28px;font-size:28px;line-height:1.15">${esc(c.heading)}</td></tr>
${c.paragraphs.map((p) => `<tr><td style="padding-top:16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6">${esc(p)}</td></tr>`).join('')}
${rows ? `<tr><td style="padding-top:24px"><table role="presentation" width="100%" style="font-family:Helvetica,Arial,sans-serif;font-size:14px">${rows}</table></td></tr>` : ''}
${c.cta ? `<tr><td style="padding-top:28px"><a href="${esc(c.cta.href)}" style="display:inline-block;background:#1c1b19;color:#f4efe7;padding:14px 22px;font-family:Helvetica,Arial,sans-serif;font-size:15px;text-decoration:none">${esc(c.cta.label)}</a></td></tr>` : ''}
<tr><td style="padding-top:40px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#655e55;line-height:1.6">${esc(STORE.brand)}, ${esc(STORE.collaboration.toLowerCase())}.<br>${esc(STORE.address.line1)}, ${esc(STORE.address.line2)}, ${esc(STORE.address.city)} ${esc(STORE.address.postalCode)} · ${esc(STORE.phoneDisplay)}<br>Sold and invoiced by ${esc(STORE.legalName)}, GSTIN ${esc(STORE.gstin)}</td></tr>
</table></td></tr></table></body></html>`
  const text = [
    c.heading,
    '',
    ...c.paragraphs,
    '',
    ...(c.rows ?? []).map(([k, v]) => `${k}: ${v}`),
    c.cta ? `\n${c.cta.label}: ${c.cta.href}` : '',
    `\n${STORE.brand} · ${STORE.phoneDisplay}`,
  ].join('\n')
  return { html, text }
}

export async function sendEmail(to: string, content: EmailContent): Promise<'sent' | 'skipped'> {
  if (!emailConfigured()) {
    console.info(`[email skipped: not configured] ${content.subject} → ${to}`)
    return 'skipped'
  }
  const { html, text } = renderEmail(content)
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({ from: process.env.EMAIL_FROM!, to, subject: content.subject, html, text, replyTo: process.env.EMAIL_REPLY_TO })
  if (error) throw new Error(`Resend: ${error.message}`)
  return 'sent'
}
