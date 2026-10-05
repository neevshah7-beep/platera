/**
 * Every page arrives rather than appears: on each navigation the page rises a little and
 * comes up from the champagne, as a card is lifted into view.
 */
export default function ShopTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-arrive">{children}</div>
}
