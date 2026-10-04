import { LightSource } from '@/components/metal/LightSource'
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
    </>
  )
}
