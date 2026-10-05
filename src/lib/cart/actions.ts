'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentRates, isSold, priceProduct } from '@/lib/catalogue'
import { BAG_COOKIE, getBagId, getPricedBag } from './bag'

export type BagActionState = { ok: boolean; message: string } | null

const productIdSchema = z.object({ productId: z.string().cuid() })
const lineIdSchema = z.object({ lineId: z.string().cuid() })

export async function addToBag(_: BagActionState, form: FormData): Promise<BagActionState> {
  const parsed = productIdSchema.safeParse({ productId: form.get('productId') })
  if (!parsed.success) return { ok: false, message: 'That piece could not be found.' }

  const product = await db.product.findUnique({ where: { id: parsed.data.productId } })
  if (!product || product.status !== 'PUBLISHED') return { ok: false, message: 'That piece is no longer listed.' }
  if (isSold(product)) return { ok: false, message: 'This piece has been sold.' }

  const pricing = priceProduct(product, await getCurrentRates())
  if (pricing.state !== 'PRICED') {
    return { ok: false, message: 'This piece is being weighed before it goes on sale. Ask us on WhatsApp to reserve it.' }
  }

  const jar = await cookies()
  let bagId = await getBagId()
  if (!bagId || !(await db.cart.findUnique({ where: { id: bagId } }))) {
    bagId = (await db.cart.create({ data: {} })).id
    jar.set(BAG_COOKIE, bagId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 60 })
  }

  // One of each piece: most are one-of-one, and a set is already a set.
  await db.cartItem.upsert({
    where: { cartId_productId: { cartId: bagId, productId: product.id } },
    update: { seenTotalPaise: pricing.breakdown.totalPaise },
    create: { cartId: bagId, productId: product.id, qty: 1, seenTotalPaise: pricing.breakdown.totalPaise },
  })
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Added to your bag.' }
}

export async function buyNow(form: FormData) {
  const result = await addToBag(null, form)
  if (!result?.ok) {
    const id = form.get('productId')
    const product = typeof id === 'string' ? await db.product.findUnique({ where: { id }, select: { slug: true } }) : null
    redirect(product ? `/piece/${product.slug}?unavailable=1` : '/collection')
  }
  redirect('/checkout/prepare')
}

export async function removeFromBag(form: FormData) {
  const parsed = lineIdSchema.safeParse({ lineId: form.get('lineId') })
  const bagId = await getBagId()
  if (!parsed.success || !bagId) return
  await db.cartItem.deleteMany({ where: { id: parsed.data.lineId, cartId: bagId } })
  revalidatePath('/', 'layout')
}

/** The customer has seen the re-priced figures; record them as the prices they agreed to. */
export async function acknowledgeBagPrices() {
  const bag = await getPricedBag()
  if (!bag.bagId) return
  await db.$transaction(
    bag.lines
      .filter((l) => l.totalPaise !== null)
      .map((l) => db.cartItem.update({ where: { id: l.id }, data: { seenTotalPaise: l.totalPaise! / l.qty } })),
  )
  revalidatePath('/bag')
  revalidatePath('/checkout')
}
