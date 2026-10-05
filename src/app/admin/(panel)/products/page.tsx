import Link from 'next/link'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/admin'
import { getCurrentRates, priceProduct } from '@/lib/catalogue'
import { PieceImage } from '@/components/media/PieceImage'
import { formatINRWhole } from '@/lib/pricing/format'
import { quickUpdate } from './actions'

const FILTERS = [
  ['all', 'All pieces'],
  ['unweighed', 'Waiting to be weighed'],
  ['sold', 'Sold'],
  ['draft', 'Not on the website'],
] as const

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  await requireAdmin('OWNER')
  const { filter = 'all', q = '' } = await searchParams
  const where = {
    ...(filter === 'unweighed' && { pricingMode: 'LIVE' as const, weightVerified: false, status: 'PUBLISHED' as const }),
    ...(filter === 'sold' && { stock: 0 }),
    ...(filter === 'draft' && { status: { not: 'PUBLISHED' as const } }),
    ...(q && { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { sku: { contains: q.toUpperCase() } }] }),
  }
  const [rates, products] = await Promise.all([
    getCurrentRates(),
    db.product.findMany({ where, orderBy: { position: 'asc' }, include: { images: { orderBy: { index: 'asc' }, take: 1 }, category: true } }),
  ])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-step-4">Pieces</h1>
        <Link href="/admin/products/new" className="btn btn-primary">Add a piece</Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-step--1">
        {FILTERS.map(([k, label]) => (
          <Link key={k} href={`/admin/products?filter=${k}`} aria-current={filter === k ? 'true' : undefined} className={filter === k ? 'underline underline-offset-4' : 'text-ink-light-muted'}>
            {label}
          </Link>
        ))}
        <form className="ml-auto">
          <input type="hidden" name="filter" value={filter} />
          <label htmlFor="q" className="sr-only">Search by name or reference</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search name or reference" className="field min-h-10 w-56 py-1" />
        </form>
      </div>

      <p className="mt-6 max-w-2xl text-step--1 text-ink-light-muted">
        Change stock or weight right here and press Save on that row. Tick “Weighed” only after weighing the piece on the shop scale; until then it shows on the website as “priced once weighed” and can’t be bought online.
      </p>

      <table className="num mt-6 w-full text-left text-step--1">
        <thead className="text-ink-light-muted">
          <tr className="border-b border-rule-light">
            <th className="py-2 pr-3 font-normal">Piece</th>
            <th className="py-2 pr-3 font-normal">On website</th>
            <th className="py-2 pr-3 font-normal">Price now</th>
            <th className="py-2 pr-3 font-normal">Stock · net weight (g) · weighed</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const pricing = priceProduct(p, rates)
            return (
              <tr key={p.id} className="border-b border-rule-light align-middle">
                <td className="py-3 pr-3">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 hover:underline">
                    <span className="block w-12 shrink-0">{p.images[0] && <PieceImage image={p.images[0]} sizes="48px" />}</span>
                    <span>
                      <span className="block font-sans text-step-0">{p.name}</span>
                      <span className="text-ink-light-muted">{p.sku} · {p.category.name}</span>
                    </span>
                  </Link>
                </td>
                <td className="py-3 pr-3">{p.status === 'PUBLISHED' ? (p.stock > 0 ? 'Yes' : 'Yes, shown as sold') : p.status === 'DRAFT' ? 'No (draft)' : 'Hidden from lists'}</td>
                <td className="py-3 pr-3">{pricing.state === 'PRICED' ? formatINRWhole(pricing.breakdown.totalPaise) : <span className="text-ruby">Needs weight</span>}</td>
                <td className="py-3 pr-3">
                  <form action={quickUpdate} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <label className="sr-only" htmlFor={`s-${p.id}`}>Stock</label>
                    <input id={`s-${p.id}`} name="stock" type="number" min={0} defaultValue={p.stock} className="field min-h-9 w-14 py-1" />
                    <label className="sr-only" htmlFor={`w-${p.id}`}>Net weight in grams</label>
                    <input id={`w-${p.id}`} name="netWeight" inputMode="decimal" defaultValue={p.netWeightMg ? (p.netWeightMg / 1000).toFixed(3) : ''} placeholder="grams" className="field min-h-9 w-24 py-1" />
                    <label className="flex items-center gap-1">
                      <input type="checkbox" name="weightVerified" defaultChecked={p.weightVerified} className="accent-[var(--ground)]" /> Weighed
                    </label>
                    <button className="link">Save</button>
                  </form>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {!products.length && <p className="mt-10 text-ink-light-muted">No pieces match. <Link href="/admin/products" className="link">Show all</Link></p>}
    </div>
  )
}
