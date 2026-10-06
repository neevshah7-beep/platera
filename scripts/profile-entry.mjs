// CPU-profiles the moment a homepage chapter arrives: node scripts/profile-entry.mjs chapter-collection
import { chromium } from 'playwright-core'
const id = process.argv[2] ?? 'chapter-collection'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
await ctx.addInitScript(() => sessionStorage.setItem('platera:entered', '1'))
const page = await ctx.newPage()
await page.goto((process.env.BASE ?? 'http://localhost:3000') + '/', { waitUntil: 'load', timeout: 180000 })
await page.waitForTimeout(3000)
// Park three screens before the chapter, idle (nothing of it built yet).
await page.evaluate((id) => window.scrollTo(0, document.getElementById(id).getBoundingClientRect().top + scrollY - innerHeight * 3), id)
await page.waitForTimeout(3000)
const cdp = await ctx.newCDPSession(page)
await cdp.send('Profiler.enable')
await cdp.send('Profiler.setSamplingInterval', { interval: 200 })
await cdp.send('Profiler.start')
await page.mouse.move(700, 450)
for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 140); await page.waitForTimeout(70) }
await page.waitForTimeout(2500)
const { profile } = await cdp.send('Profiler.stop')
const self = new Map()
const byId = new Map(profile.nodes.map((n) => [n.id, n]))
const dt = profile.timeDeltas
profile.samples.forEach((sid, i) => {
  const n = byId.get(sid)
  const f = n.callFrame
  const key = `${f.functionName || '(anon)'} ${f.url.split('/').slice(-1)[0]}:${f.lineNumber}`
  self.set(key, (self.get(key) ?? 0) + (dt[i] ?? 0) / 1000)
})
console.log([...self].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${v.toFixed(0).padStart(6)} ms  ${k}`).join('\n'))
// Who calls the heaviest native function: walk up the parents.
const parent = new Map()
for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id)
const hot = process.env.HOT ?? 'getProgramParameter'
const stacks = new Map()
profile.samples.forEach((sid, i) => {
  if (byId.get(sid).callFrame.functionName !== hot) return
  const chain = []
  let p = parent.get(sid)
  while (p && chain.length < 8) {
    const f = byId.get(p).callFrame
    chain.push(`${f.functionName || '(anon)'}:${f.url.split('/').pop()}:${f.lineNumber}`)
    p = parent.get(p)
  }
  const k = chain.join(' < ')
  stacks.set(k, (stacks.get(k) ?? 0) + (dt[i] ?? 0) / 1000)
})
console.log('--- callers of', hot)
console.log([...stacks].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${v.toFixed(0).padStart(6)} ms  ${k}`).join('\n'))
await browser.close()
