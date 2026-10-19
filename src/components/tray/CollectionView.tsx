import Link from 'next/link'
import { PieceGrid } from '@/components/tray/PieceGrid'
import { getCurrentRates, listProducts, priceProduct, sortPriced, type CatalogueFilters, type SortKey } from '@/lib/catalogue'

type Search = { finish?: string; stone?: string; sort?: string }

const FINISH = [
  ['', 'All'],
  ['silver', 'Silver'],
  ['gold-plated', 'Gold plated'],
] as const
const STONE = [
  ['', 'All'],
  ['none', 'No stones'],
  ['cz', 'Cubic zirconia'],
  ['coloured', 'Coloured stones'],
] as const
const SORT = [
  ['', 'As laid out'],
  ['weight-asc', 'Weight, lightest first'],
  ['weight-desc', 'Weight, heaviest first'],
] as const

export function parseFilters(search: Search): CatalogueFilters {
  const finish = FINISH.some(([v]) => v && v === search.finish) ? (search.finish as CatalogueFilters['finish']) : undefined
  const stone = STONE.some(([v]) => v && v === search.stone) ? (search.stone as CatalogueFilters['stone']) : undefined
  const sort = SORT.some(([v]) => v && v === search.sort) ? (search.sort as SortKey) : undefined
  return { finish, stone, sort }
}

function IndexRow({
  label,
  options,
  current,
  param,
  basePath,
  search,
}: {
  label: string
  options: readonly (readonly [string, string])[]
  current: string | undefined
  param: keyof Search
  basePath: string
  search: Search
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t border-rule py-3">
      <span className="w-24 shrink-0 text-step--1 text-ink-muted">{label}</span>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-step--1">
        {options.map(([value, text]) => {
          const next = new URLSearchParams(Object.entries({ ...search, [param]: value }).filter(([, v]) => v) as [string, string][])
          const href = next.size ? `${basePath}?${next}` : basePath
          const active = (current ?? '') === value
          return (
            <li key={value || 'all'}>
              <Link
                href={href}
                scroll={false}
                aria-current={active ? 'true' : undefined}
                className={active ? 'text-ink underline decoration-argent underline-offset-[6px]' : 'text-ink-muted hover:text-ink'}
              >
                {text}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** The collection as a jeweller's index: filters are plain links, so every state has a URL you can share. */
export async function CollectionView({ basePath, category, search }: { basePath: string; category?: string; search: Search }) {
  const filters = parseFilters(search)
  const [rates, products] = await Promise.all([getCurrentRates(), listProducts({ ...filters, category })])
  const items = sortPriced(
    products.map((product) => ({ product, pricing: priceProduct(product, rates) })),
    filters.sort,
  )

  return (
    <>
      <div className="mt-10" role="group" aria-label="Filter and sort">
        <IndexRow label="Finish" options={FINISH} current={filters.finish} param="finish" basePath={basePath} search={search} />
        {/* Rings say nothing about their stones (the owner's wish), so they have no stones filter. */}
        {category !== 'rings' && <IndexRow label="Stones" options={STONE} current={filters.stone} param="stone" basePath={basePath} search={search} />}
        <IndexRow label="Order" options={SORT} current={filters.sort} param="sort" basePath={basePath} search={search} />
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-rule pt-3">
          <p className="num text-step--1 text-ink-muted" aria-live="polite">
            {items.length} {items.length === 1 ? 'piece' : 'pieces'}
          </p>
        </div>
      </div>

      <div className="mt-16">
        {items.length ? (
          <PieceGrid items={items} priorityFirst label="Pieces" />
        ) : (
          <div className="py-24">
            <p className="font-display text-step-3">Nothing on the tray matches that.</p>
            <p className="mt-3 text-ink-muted">
              <Link href={basePath} className="link text-ink">Clear the filters</Link>, or ask us on WhatsApp for something specific. We may have it at the store.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
