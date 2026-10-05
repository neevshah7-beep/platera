/**
 * Add-to-bag flight: a copy of the piece's photograph lifts off, arcs across the page in
 * a gold-rimmed circle, shrinks into the Bag link and lands; the bag answers with a gold
 * ring that blooms and the count ticks up. Web Animations only (compositor-friendly).
 */
export function flyToBag(from: HTMLElement) {
  const target = document.querySelector<HTMLElement>('[data-bag-target]')
  window.dispatchEvent(new CustomEvent('platera:bag-added'))
  if (!target || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const a = from.getBoundingClientRect()
  const b = target.getBoundingClientRect()
  const size = Math.min(160, Math.max(90, a.width * 0.4))
  const ghost = document.createElement('div')
  ghost.className = 'bag-flight'
  const src = (from as HTMLImageElement).currentSrc || (from as HTMLImageElement).src || ''
  ghost.style.backgroundImage = `url(${src})`
  ghost.style.width = ghost.style.height = `${size}px`
  document.body.appendChild(ghost)
  const sx = a.left + a.width / 2 - size / 2, sy = a.top + a.height / 2 - size / 2
  const ex = b.left + b.width / 2 - size / 2, ey = b.top + b.height / 2 - size / 2
  // The arc: up and over, like a hand tossing it into the bag.
  const mx = (sx + ex) / 2, my = Math.min(sy, ey) - Math.max(120, Math.abs(ex - sx) * 0.25)
  const anim = ghost.animate(
    [
      { transform: `translate(${sx}px, ${sy}px) scale(0.6) rotate(0deg)`, opacity: 0 },
      { transform: `translate(${sx}px, ${sy - 30}px) scale(1) rotate(-6deg)`, opacity: 1, offset: 0.16 },
      { transform: `translate(${mx}px, ${my}px) scale(0.72) rotate(8deg)`, opacity: 1, offset: 0.58 },
      { transform: `translate(${ex}px, ${ey}px) scale(0.12) rotate(18deg)`, opacity: 0.9 },
    ],
    { duration: 1150, easing: 'cubic-bezier(0.55, 0, 0.3, 1)', fill: 'forwards' },
  )
  anim.onfinish = () => {
    ghost.remove()
    target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' })
    const ring = document.createElement('span')
    ring.className = 'bag-ring'
    const r = target.getBoundingClientRect()
    ring.style.left = `${r.left + r.width / 2}px`
    ring.style.top = `${r.top + r.height / 2}px`
    document.body.appendChild(ring)
    ring.animate([{ transform: 'translate(-50%,-50%) scale(0.2)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(2.6)', opacity: 0 }], { duration: 800, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }).onfinish = () => ring.remove()
  }
}
