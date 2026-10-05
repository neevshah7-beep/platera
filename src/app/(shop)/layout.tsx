import { ConsentAndTags } from '@/components/site/ConsentAndTags'
import { SiteFooter } from '@/components/site/SiteFooter'
import { getCurrentRates } from '@/lib/catalogue'
import { getBagCount } from '@/lib/cart/bag'
import { Header } from '@/site/Header'
import { SmoothScroll } from '@/site/SmoothScroll'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [rates, bagCount] = await Promise.all([getCurrentRates(), getBagCount()])
  return (
    <>
      <SmoothScroll />
      <Header bagCount={bagCount} />
      <main id="main" className="pt-16">{children}</main>
      <SiteFooter rate={rates.SILVER_925} />
      <ConsentAndTags gaId={process.env.NEXT_PUBLIC_GA4_ID} pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
    </>
  )
}
