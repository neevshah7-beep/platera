import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/admin'
import { ImageManager } from '../ImageManager'
import { ProductForm, type ProductDefaults } from '../ProductForm'

const grams = (mg: number | null) => (mg ? (mg / 1000).toFixed(3) : '')
const rupees = (p: number | null) => (p ? (p / 100).toFixed(2) : '')

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin('OWNER')
  const { id } = await params
  const { created } = await searchParams
  const isNew = id === 'new'
  const [categories, product] = await Promise.all([
    db.category.findMany({ orderBy: { position: 'asc' }, select: { id: true, name: true } }),
    isNew ? null : db.product.findUnique({ where: { id }, include: { images: { orderBy: [{ kind: 'asc' }, { index: 'asc' }] } } }),
  ])
  if (!isNew && !product) notFound()

  const defaults: ProductDefaults = product
    ? {
        id: product.id,
        name: product.name,
        sku: product.sku,
        slug: product.slug,
        categoryId: product.categoryId,
        summary: product.summary,
        description: product.description,
        status: product.status,
        featured: product.featured,
        metal: product.metal,
        finish: product.finish ?? '',
        pricingMode: product.pricingMode,
        makingPct: String(product.makingPct ?? 15),
        netWeight: grams(product.netWeightMg),
        grossWeight: grams(product.grossWeightMg),
        weightVerified: product.weightVerified,
        stoneValue: rupees(product.stonePaise),
        hallmarkCharge: rupees(product.hallmarkPaise),
        fixedPrice: rupees(product.fixedPricePaise),
        hallmarked: product.hallmarked,
        huid: product.huid ?? '',
        stoneType: product.stoneType,
        stoneDetails: product.stoneDetails ?? '',
        stock: String(product.stock),
        availability: product.availability,
        leadTimeDays: product.leadTimeDays ?? '',
        lengthInches: product.lengthInches?.toString() ?? '',
        dimensions: product.dimensions ?? '',
        returnable: product.returnable,
        returnNote: product.returnNote ?? '',
        seoTitle: product.seoTitle ?? '',
        seoDescription: product.seoDescription ?? '',
      }
    : {
        categoryId: categories[0]?.id ?? '',
        status: 'DRAFT',
        metal: 'SILVER_925',
        pricingMode: 'LIVE',
        makingPct: '15',
        hallmarked: true,
        returnable: true,
        stock: '1',
        availability: 'IN_STOCK',
        stoneType: 'NONE',
        featured: false,
        weightVerified: false,
      }

  return (
    <div className="space-y-16">
      <div>
        <Link href="/admin/products" className="link text-step--1">All pieces</Link>
        <h1 className="mt-3 text-step-4">{product ? product.name : 'Add a piece'}</h1>
        {product && (
          <p className="mt-2 text-step--1 text-ink-light-muted">
            <Link href={`/piece/${product.slug}`} target="_blank" className="link">See it on the website</Link>
          </p>
        )}
        {created && <p role="status" className="mt-4 border-l-2 border-ground pl-4">Saved. Now add its photographs below.</p>}
      </div>
      {product && <ImageManager productId={product.id} sku={product.sku} images={product.images} />}
      <ProductForm categories={categories} defaults={defaults} />
    </div>
  )
}
