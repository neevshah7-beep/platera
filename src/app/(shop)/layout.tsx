import { getBagCount } from '@/lib/cart/bag'
import { Header } from '@/site/Header'
import { SmoothScroll } from '@/site/SmoothScroll'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const bagCount = await getBagCount()
  return (
    <>
      <SmoothScroll />
      <Header bagCount={bagCount} />
      <main id="main">{children}</main>
    </>
  )
}
