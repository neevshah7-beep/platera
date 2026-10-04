import { z } from 'zod'

/**
 * Shared validation for every mutation. The same schema checks the form on the
 * server and gives the customer a plain-language message.
 */

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
] as const

const trimmed = (max: number, message: string) => z.string().trim().min(1, message).max(max, 'That’s too long.')

export const phoneSchema = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, '').replace(/^(\+91|0091|91(?=\d{10}$)|0)/, ''))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number.'))

export const emailSchema = z.string().trim().toLowerCase().email('Enter an email address we can send your receipt to.').max(200)

export const pincodeSchema = z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a 6-digit PIN code.')

export const addressSchema = z.object({
  name: trimmed(120, 'Enter the name for delivery.'),
  phone: phoneSchema,
  line1: trimmed(200, 'Enter the house, building and street.'),
  line2: z.string().trim().max(200).optional().default(''),
  city: trimmed(80, 'Enter the city.'),
  state: z.enum(INDIAN_STATES, { message: 'Choose a state.' }),
  pincode: pincodeSchema,
})

export const checkoutSchema = z.object({
  email: emailSchema,
  address: addressSchema,
  giftMessage: z.string().trim().max(240, 'Keep the message under 240 characters.').optional().default(''),
  hidePrices: z.boolean().default(false),
  acceptPolicy: z.literal(true, { message: 'Please confirm you’ve read the return conditions.' }),
})
export type CheckoutInput = z.infer<typeof checkoutSchema>

export const appointmentSchema = z.object({
  kind: z.enum(['STORE_VISIT', 'VIDEO_CALL']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date.'),
  slot: z.string().regex(/^\d{2}:\d{2}$/, 'Choose a time.'),
  name: trimmed(120, 'Tell us your name.'),
  phone: phoneSchema,
  email: z.union([emailSchema, z.literal('')]).optional(),
  notes: z.string().trim().max(1000).optional().default(''),
  pieces: z.array(z.string().max(120)).max(6).default([]),
})

export const enquirySchema = z.object({
  kind: z.enum(['PIECE', 'CUSTOM_ORDER', 'GENERAL']),
  productSlug: z.string().max(120).optional(),
  name: trimmed(120, 'Tell us your name.'),
  phone: phoneSchema,
  email: z.union([emailSchema, z.literal('')]).optional(),
  message: trimmed(2000, 'Tell us what you’re looking for.'),
})

export const rateSchema = z.object({
  metal: z.enum(['SILVER_925', 'GOLD_22K', 'GOLD_18K', 'GOLD_14K', 'PLATINUM_950']),
  rupeesPerGram: z
    .string()
    .trim()
    .regex(/^\d{1,6}(\.\d{1,2})?$/, 'Enter the rate in rupees per gram, like 162.50')
    .transform((s) => Math.round(Number(s) * 100))
    .pipe(z.number().int().positive('The rate must be more than zero.')),
})

/** Flatten Zod issues into { 'address.pincode': 'Enter a 6-digit PIN code.' } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    out[key] ??= issue.message
  }
  return out
}
