'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { audit, requireAdmin } from '@/lib/auth/admin'
import { classifyUpload, storeProductImage } from '@/lib/media/storage'
import { fieldErrors, productSchema } from '@/lib/validation'

export type ProductFormState = { errors: Record<string, string>; message?: string; values?: Record<string, string> } | null

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90)
const bool = (form: FormData, k: string) => form.get(k) === 'on'

export async function saveProduct(_: ProductFormState, form: FormData): Promise<ProductFormState> {
  const user = await requireAdmin('OWNER')
  const values = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string')) as Record<string, string>
  const id = values.id || null

  const parsed = productSchema.safeParse({
    ...values,
    weightVerified: bool(form, 'weightVerified'),
    hallmarked: bool(form, 'hallmarked'),
    returnable: bool(form, 'returnable'),
    featured: bool(form, 'featured'),
  })
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: 'Some details need fixing. They’re marked below.', values }
  const p = parsed.data
  const slug = p.slug || slugify(p.name)

  const clash = await db.product.findFirst({ where: { OR: [{ slug }, { sku: p.sku }], NOT: id ? { id } : undefined }, select: { slug: true, sku: true } })
  if (clash) {
    return { errors: clash.sku === p.sku ? { sku: 'Another piece already uses this reference.' } : { slug: 'Another piece already uses this web address.' }, values }
  }

  const before = id ? await db.product.findUnique({ where: { id } }) : null
  const data = {
    sku: p.sku,
    slug,
    name: p.name,
    summary: p.summary,
    description: p.description,
    categoryId: p.categoryId,
    status: p.status,
    pricingMode: p.pricingMode,
    metal: p.metal,
    finish: p.finish || null,
    netWeightMg: p.netWeight,
    grossWeightMg: p.grossWeight,
    weightVerified: p.weightVerified,
    makingPct: p.makingPct,
    stonePaise: p.stoneValue,
    hallmarkPaise: p.hallmarkCharge,
    fixedPricePaise: p.fixedPrice || null,
    hallmarked: p.hallmarked,
    huid: p.huid || null,
    stoneType: p.stoneType,
    stoneDetails: p.stoneDetails || null,
    stock: p.stock,
    availability: p.availability,
    leadTimeDays: p.leadTimeDays || null,
    returnable: p.returnable,
    returnNote: p.returnNote || null,
    lengthInches: p.lengthInches ? p.lengthInches : null,
    dimensions: p.dimensions || null,
    featured: p.featured,
    seoTitle: p.seoTitle || null,
    seoDescription: p.seoDescription || null,
    publishedAt: p.status === 'PUBLISHED' ? (before?.publishedAt ?? new Date()) : before?.publishedAt ?? null,
    soldAt: p.stock > 0 ? null : before?.soldAt ?? null,
  }

  const saved = id ? await db.product.update({ where: { id }, data }) : await db.product.create({ data })
  await audit(user.id, id ? 'product.update' : 'product.create', 'Product', saved.id, { sku: saved.sku })
  revalidatePath('/', 'layout')
  if (!id) redirect(`/admin/products/${saved.id}?created=1`)
  return { errors: {}, message: 'Saved. The website is updated.' }
}

/** Inline edit from the list: stock and weight, the two things that change most. */
export async function quickUpdate(form: FormData) {
  const user = await requireAdmin('OWNER')
  const parsed = z
    .object({
      id: z.string(),
      stock: z.coerce.number().int().min(0).max(999),
      netWeight: z.string().trim().regex(/^(\d{1,4}(\.\d{1,3})?)?$/),
    })
    .safeParse({ id: form.get('id'), stock: form.get('stock'), netWeight: form.get('netWeight') ?? '' })
  if (!parsed.success) return
  const { id, stock, netWeight } = parsed.data
  const mg = netWeight ? Math.round(Number(netWeight) * 1000) : null
  const verified = form.get('weightVerified') === 'on' && mg !== null
  await db.product.update({
    where: { id },
    data: { stock, netWeightMg: mg, weightVerified: verified, soldAt: stock > 0 ? null : undefined },
  })
  await audit(user.id, 'product.quick', 'Product', id, { stock, mg, verified })
  revalidatePath('/', 'layout')
}

export type UploadState = { message: string; ok: boolean } | null

export async function uploadImages(_: UploadState, form: FormData): Promise<UploadState> {
  await requireAdmin('OWNER')
  const productId = String(form.get('productId'))
  const product = await db.product.findUnique({ where: { id: productId }, include: { images: true } })
  if (!product) return { ok: false, message: 'Piece not found.' }
  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (!files.length) return { ok: false, message: 'Choose one or more photographs first.' }

  const results: string[] = []
  let nextIndex = Math.max(0, ...product.images.filter((i) => i.kind === 'PHOTO').map((i) => i.index)) + 1
  for (const file of files.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
      results.push(`${file.name}: not a photo (JPEG, PNG or WebP only).`)
      continue
    }
    if (file.size > 25 * 1024 * 1024) {
      results.push(`${file.name}: larger than 25 MB.`)
      continue
    }
    const { kind, index } = classifyUpload(file.name, product.sku)
    const i = index ?? nextIndex++
    const name = kind === 'TURNTABLE' ? `${product.sku}-360-${String(i).padStart(2, '0')}` : kind === 'PHOTO' ? `${product.sku}-${String(i).padStart(2, '0')}` : `${product.sku}-${kind.toLowerCase()}`
    try {
      const stored = await storeProductImage(name, Buffer.from(await file.arrayBuffer()))
      await db.productImage.upsert({
        where: { productId_kind_index: { productId, kind, index: i } },
        update: { ...stored },
        create: { productId, kind, index: i, alt: i === 1 && kind === 'PHOTO' ? `${product.name} in 925 sterling silver` : `${product.name}, another view`, ...stored },
      })
      results.push(`${file.name}: added.`)
    } catch (e) {
      results.push(`${file.name}: ${(e as Error).message}`)
    }
  }
  revalidatePath('/', 'layout')
  return { ok: results.every((r) => r.endsWith('added.')), message: results.join(' ') }
}

export async function deleteImage(form: FormData) {
  await requireAdmin('OWNER')
  const id = String(form.get('imageId'))
  await db.productImage.delete({ where: { id } }).catch(() => null)
  revalidatePath('/', 'layout')
}

export async function setImageAlt(form: FormData) {
  await requireAdmin('OWNER')
  const id = String(form.get('imageId'))
  const alt = z.string().trim().min(3).max(200).safeParse(form.get('alt'))
  if (!alt.success) return
  await db.productImage.update({ where: { id }, data: { alt: alt.data } })
  revalidatePath('/', 'layout')
}
