/**
 * Render only while on screen. Each live WebGL scene checks `gate.on` at the top of its
 * frame and does nothing while scrolled away, so at most one or two scenes ever draw at
 * once and scrolling stays smooth.
 */
export function visibleGate(el: Element) {
  const gate = { on: true, dispose: () => io.disconnect() }
  const io = new IntersectionObserver(([e]) => (gate.on = e.isIntersecting), { rootMargin: '10% 0px' })
  io.observe(el)
  return gate
}
