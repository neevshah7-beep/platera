import { LightSource } from '@/components/metal/LightSource'
import { ConsentAndTags } from '@/components/site/ConsentAndTags'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SheenTransition } from '@/components/world/SheenTransition'
import { WorldMount } from '@/components/world/WorldMount'
import { getCurrentRates } from '@/lib/catalogue'
import { getBagCount } from '@/lib/cart/bag'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [rates, bagCount] = await Promise.all([getCurrentRates(), getBagCount()])
  return (
    <>
      {/* The 3D house sits behind everything; the HTML shop is drawn on top of it. */}
      <WorldMount />
      <LightSource />
      <SheenTransition />
      <div className="relative z-10">
        <SiteHeader bagCount={bagCount} />
        <main id="main">{children}</main>
        <SiteFooter rate={rates.SILVER_925} />
      </div>
      <ConsentAndTags gaId={process.env.NEXT_PUBLIC_GA4_ID} pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
    </>
  )
}
