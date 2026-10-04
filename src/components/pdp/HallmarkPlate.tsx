/**
 * The hallmark, drawn as the stamp it is: a small struck plate carrying the purity
 * and, where the piece has one, the six-character HUID. We don't reproduce the BIS
 * logo itself (it's a certification mark); the text says what it is.
 */
export function HallmarkPlate({ purity, huid, metal = 'argent' }: { purity: string; huid?: string | null; metal?: 'argent' | 'gold' }) {
  const edge = metal === 'gold' ? 'var(--gold)' : 'var(--argent)'
  return (
    <figure className="inline-flex items-stretch" aria-label={`BIS hallmark, purity ${purity}${huid ? `, HUID ${huid}` : ''}`}>
      <span className="num flex items-center border px-3 py-2 font-display text-step-1" style={{ borderColor: edge }}>
        BIS
      </span>
      <span className="num flex items-center border border-l-0 px-3 py-2 font-display text-step-1" style={{ borderColor: edge }}>
        {purity}
      </span>
      {huid && (
        <span className="num flex items-center border border-l-0 px-3 py-2 text-step-0 tracking-[0.08em]" style={{ borderColor: edge }}>
          {huid}
        </span>
      )}
    </figure>
  )
}
