'use client'

import { useActionState } from 'react'
import { saveProduct, type ProductFormState } from './actions'

type Category = { id: string; name: string }
export type ProductDefaults = Record<string, string | boolean>

function F({
  name,
  label,
  hint,
  state,
  defaults,
  type = 'text',
  className = '',
  ...rest
}: {
  name: string
  label: string
  hint?: string
  state: ProductFormState
  defaults: ProductDefaults
  type?: string
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const err = state?.errors[name]
  const value = state?.values?.[name] ?? (defaults[name] as string | undefined) ?? ''
  return (
    <div className={className}>
      <label htmlFor={`p-${name}`} className="label">{label}</label>
      <input id={`p-${name}`} name={name} type={type} defaultValue={value} className="field" aria-invalid={Boolean(err)} {...rest} />
      {hint && !err && <p className="mt-1 text-step--1 text-ink-light-muted">{hint}</p>}
      {err && <p className="mt-1 text-step--1 text-garnet">{err}</p>}
    </div>
  )
}

function Check({ name, label, defaults, state }: { name: string; label: string; defaults: ProductDefaults; state: ProductFormState }) {
  const checked = state?.values ? state.values[name] === 'on' : Boolean(defaults[name])
  return (
    <label className="flex items-start gap-3">
      <input type="checkbox" name={name} defaultChecked={checked} className="mt-1.5 size-4 accent-[var(--onyx)]" />
      <span>{label}</span>
    </label>
  )
}

function Select({ name, label, options, defaults, state }: { name: string; label: string; options: [string, string][]; defaults: ProductDefaults; state: ProductFormState }) {
  const value = state?.values?.[name] ?? (defaults[name] as string)
  return (
    <div>
      <label htmlFor={`p-${name}`} className="label">{label}</label>
      <select id={`p-${name}`} name={name} defaultValue={value} key={value} className="field">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {state?.errors[name] && <p className="mt-1 text-step--1 text-garnet">{state.errors[name]}</p>}
    </div>
  )
}

export function ProductForm({ categories, defaults }: { categories: Category[]; defaults: ProductDefaults }) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, null)
  const props = { state, defaults }

  return (
    <form action={action} className="space-y-14" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id as string} />}

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="mb-4 font-display text-step-3">The piece</legend>
        <F name="name" label="Name" {...props} className="sm:col-span-2" />
        <F name="sku" label="Reference" hint="Like PLT-NKS-021. It’s also the start of every photo’s file name." {...props} />
        <Select name="categoryId" label="Category" options={categories.map((c) => [c.id, c.name])} {...props} />
        <F name="summary" label="One sentence about it" hint="Shown under the name and in Google results." {...props} className="sm:col-span-2" />
        <div className="sm:col-span-2">
          <label htmlFor="p-description" className="label">Description</label>
          <textarea id="p-description" name="description" rows={4} defaultValue={(state?.values?.description ?? defaults.description) as string} className="field resize-y" />
        </div>
        <Select name="status" label="On the website?" options={[['PUBLISHED', 'Yes, show it'], ['DRAFT', 'No, keep it as a draft'], ['ARCHIVED', 'Hide it from lists, keep its page']]} {...props} />
        <Check name="featured" label="Feature it on the home page tray" {...props} />
      </fieldset>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="mb-4 font-display text-step-3">Metal, weight and price</legend>
        <Select name="metal" label="Metal" options={[['SILVER_925', '925 sterling silver'], ['GOLD_22K', '22 karat gold'], ['GOLD_18K', '18 karat gold'], ['GOLD_14K', '14 karat gold'], ['PLATINUM_950', '950 platinum']]} {...props} />
        <F name="finish" label="Finish (optional)" hint="For example: Gold plated" {...props} />
        <Select name="pricingMode" label="How is it priced?" options={[['LIVE', 'By weight at today’s rate'], ['FIXED', 'A fixed price']]} {...props} />
        <Select name="makingPct" label="Making charge" options={[['10', '10% of metal value'], ['15', '15% of metal value'], ['20', '20% of metal value']]} {...props} />
        <F name="netWeight" label="Net weight (grams)" inputMode="decimal" hint="Metal only, from the shop scale. Up to three decimals." {...props} />
        <F name="grossWeight" label="Gross weight (grams)" inputMode="decimal" hint="Everything, including stones and beads." {...props} />
        <div className="sm:col-span-2"><Check name="weightVerified" label="I’ve weighed this piece and the net weight above is exact. (There’s no weight tolerance, so this is what the customer pays for.)" {...props} /></div>
        <F name="stoneValue" label="Stone value (₹, optional)" inputMode="decimal" {...props} />
        <F name="hallmarkCharge" label="Hallmarking charge (₹, optional)" inputMode="decimal" {...props} />
        <F name="fixedPrice" label="Fixed price including GST (₹)" inputMode="decimal" hint="Only used when the piece is priced at a fixed price." {...props} />
      </fieldset>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="mb-4 font-display text-step-3">Hallmark and stones</legend>
        <Check name="hallmarked" label="BIS hallmarked" {...props} />
        <F name="huid" label="HUID (six characters, if it has one)" {...props} />
        <Select
          name="stoneType"
          label="Stones"
          options={[['NONE', 'No stones'], ['CUBIC_ZIRCONIA', 'Cubic zirconia (CZ)'], ['NATURAL_DIAMOND', 'Natural diamond'], ['LAB_GROWN_DIAMOND', 'Lab-grown diamond'], ['KUNDAN_GLASS', 'Kundan-style stones'], ['PEARL', 'Pearl'], ['GEMSTONE', 'Gemstone'], ['MIXED', 'Mixed']]}
          {...props}
        />
        <F name="stoneDetails" label="Stone details" hint="What a customer would ask: type, colour, cut. Diamonds: carat, colour, clarity, certificate." {...props} />
      </fieldset>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="mb-4 font-display text-step-3">Stock, size and returns</legend>
        <F name="stock" label="How many in stock" type="number" min={0} hint="1 for a one-of-one piece. At 0 the page stays up and shows “Sold”." {...props} />
        <Select name="availability" label="Availability" options={[['IN_STOCK', 'In stock'], ['MADE_TO_ORDER', 'Made to order']]} {...props} />
        <F name="leadTimeDays" label="Made-to-order time (optional)" hint="For example: 15–20 days" {...props} />
        <F name="lengthInches" label="Length (inches, optional)" inputMode="decimal" {...props} />
        <F name="dimensions" label="Dimensions (optional)" hint="For example: Pendant 3.2 × 2.1 cm" {...props} className="sm:col-span-2" />
        <Check name="returnable" label="Can be returned under the returns policy" {...props} />
        <F name="returnNote" label="Return note (optional)" hint="Shown on the piece and at checkout, e.g. the earrings rule." {...props} />
      </fieldset>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="mb-4 font-display text-step-3">Google (optional)</legend>
        <F name="slug" label="Web address" hint="Leave empty to make one from the name." {...props} />
        <F name="seoTitle" label="Search title (under 60 characters)" maxLength={60} {...props} />
        <F name="seoDescription" label="Search description (under 155 characters)" maxLength={155} {...props} className="sm:col-span-2" />
      </fieldset>

      <div className="sticky bottom-0 -mx-[var(--gutter)] flex items-center gap-4 border-t border-rule-light bg-alabaster px-[var(--gutter)] py-4">
        <button className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
        <p role="status" aria-live="polite" className={state && Object.keys(state.errors).length ? 'text-garnet' : ''}>{state?.message}</p>
      </div>
    </form>
  )
}
