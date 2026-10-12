import { ConsentAndTags } from '@/components/site/ConsentAndTags'
import { SiteFooter } from '@/components/site/SiteFooter'
import { BackToHouse } from '@/site/BackToHouse'
import { GoldCursor } from '@/site/GoldCursor'
import { Header } from '@/site/Header'
import { SmoothScroll } from '@/site/SmoothScroll'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main id="main" className="pt-16">{children}</main>
      <SiteFooter />
      <BackToHouse />
      <GoldCursor />
      <ConsentAndTags gaId={process.env.NEXT_PUBLIC_GA4_ID} pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
    </>
  )
}
