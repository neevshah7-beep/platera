/**
 * Scenes are built ahead of time, one per idle moment, so scrolling never pays for
 * shader compiles or texture generation. A scene that comes into view before its turn
 * is built at once. Built scenes are paused off-screen (visible.ts), never torn down.
 */
type Task = { run: () => void; done: boolean }
const queue: Task[] = []
let pumping = false
let lastScroll = 0
if (typeof window !== 'undefined') addEventListener('wheel', () => (lastScroll = performance.now()), { passive: true })
if (typeof window !== 'undefined') addEventListener('touchmove', () => (lastScroll = performance.now()), { passive: true })

function pump() {
  if (pumping) return
  pumping = true
  const step = () => {
    const t = queue.find((q) => !q.done)
    if (!t) return void (pumping = false)
    // Never build in the middle of a scroll: wait for the hand to rest.
    if (performance.now() - lastScroll < 700) return void setTimeout(step, 250)
    t.done = true
    t.run()
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    if (ric) ric(step, { timeout: 1500 })
    else setTimeout(step, 120)
  }
  // After the house fonts (canvas lettering uses them) and the first paint have settled.
  document.fonts.ready.then(() => setTimeout(step, 900))
}

export function prewarm(run: () => void) {
  const task: Task = { run, done: false }
  queue.push(task)
  pump()
  return {
    /** Build now if it hasn't been yet (the scene is about to be seen). */
    now() {
      if (!task.done) {
        task.done = true
        run()
      }
    },
    cancel() {
      task.done = true
    },
  }
}
