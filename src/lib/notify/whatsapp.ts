import 'server-only'

/**
 * WhatsApp Business (Cloud API) template messages. Templates must be created and
 * approved in Meta Business Manager with the names and parameter order below
 * (see docs/WHATSAPP_TEMPLATES.md). Without credentials, messages are skipped and the
 * admin shows a click-to-chat link with the same text instead.
 */
export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
}

export type WhatsAppTemplate =
  | 'order_confirmed'
  | 'order_dispatched'
  | 'order_out_for_delivery'
  | 'order_delivered'
  | 'order_refunded'
  | 'appointment_confirmed'
  | 'service_update'

export async function sendWhatsAppTemplate(phone10: string, template: WhatsAppTemplate, params: string[]): Promise<'sent' | 'skipped'> {
  if (!whatsappConfigured()) {
    console.info(`[whatsapp skipped: not configured] ${template} → ${phone10}`)
    return 'skipped'
  }
  const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: `91${phone10}`,
      type: 'template',
      template: {
        name: template,
        language: { code: 'en' },
        components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
      },
    }),
  })
  if (!res.ok) throw new Error(`WhatsApp ${template}: ${res.status} ${await res.text()}`)
  return 'sent'
}
