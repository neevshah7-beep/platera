import { LightSource } from '@/components/metal/LightSource'
import { ConsentAndTags } from '@/components/site/ConsentAndTags'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { getCurrentRates } from '@/lib/catalogue'
import { getBagCount } from '@/lib/cart/bag'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [rates, bagCount] = await Promise.all([getCurrentRates(), getBagCount()])
  return (
    <>
      <LightSource />
      <SiteHeader bagCount={bagCount} />
      <main id="main">{children}</main>
      <SiteFooter rate={rates.SILVER_925} />
      <ConsentAndTags gaId={process.env.NEXT_PUBLIC_GA4_ID} pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
    </>
  )
}
