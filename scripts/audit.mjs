// Page-by-page audit at desktop and phone size: crawls every internal page, scrolls each one
// top to bottom with real wheel / touch-sized steps, and reports HTTP status, console and page
// errors, failed requests, sideways overflow, text clipped by its box, tap targets too small on
// phone, the slowest frame while scrolling, and saves a screenshot strip per page in look/audit.
// node scripts/audit.mjs [phone]   (BASE=http://localhost:3001)
import { chromium, devices } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
const base = process.env.BASE ?? 'http://localhost:3001'
const phone = process.argv[2] === 'phone'
const only = process.env.ONLY?.split(',')
const tag = phone ? 'phone' : 'desk'
await mkdir('look/audit', { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext(phone ? { ...devices['iPhone 13'], defaultBrowserType: undefined } : { viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
const page = await ctx.newPage()
const seen = new Set(only ?? ['/'])
const queue = [...seen]
const report = []
const ignore = (t) => /X4122|X3595|React DevTools|PCFSoftShadowMap|THREE.Clock|GPU stall|GL Driver Message/.test(t)
while (queue.length && seen.size < 90) {
  const path = queue.shift()
  const errs = [], failed = []
  const onC = (m) => m.type() === 'error' && !ignore(m.text()) && errs.push(m.text().slice(0, 180))
  const onE = (e) => errs.push('pageerror: ' + e.message.slice(0, 180))
  const onF = (r) => !/_rsc=/.test(r.url()) && failed.push(r.url().replace(base, '').slice(0, 90) + ' ' + (r.failure()?.errorText ?? ''))
  const onR = (r) => r.status() >= 400 && r.url().startsWith(base) && failed.push(r.url().replace(base, '').slice(0, 90) + ' HTTP ' + r.status())
  page.on('console', onC); page.on('pageerror', onE); page.on('requestfailed', onF); page.on('response', onR)
  let status = 0
  try { status = (await page.goto(base + path, { waitUntil: 'load', timeout: 120_000 }))?.status() ?? 0; await page.waitForTimeout(1800) } catch (e) { errs.push('nav: ' + e.message.slice(0, 100)) }
  const name = (path === '/' ? 'home' : path.slice(1).replace(/[\/\[\]]/g, '_')) + '-' + tag
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  const vh = page.viewportSize().height
  // frame timing while the page is scrolled the way a person does
  await page.evaluate(() => { window.__f = []; let l = performance.now(); const t = (n) => { window.__f.push(n - l); l = n; window.__raf = requestAnimationFrame(t) }; window.__raf = requestAnimationFrame(t) })
  const shots = Math.min(7, Math.max(1, Math.ceil(height / vh)))
  let moved = 0
  for (let i = 0; i < shots; i++) {
    await page.screenshot({ path: `look/audit/${name}-${i}.jpg`, type: 'jpeg', quality: 60 })
    const target = Math.round(((i + 1) / shots) * (height - vh))
    if (phone) { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), target); await page.waitForTimeout(1100) }
    else { await page.mouse.move(700, 450); for (let s = 0; s < 14 && moved < target; s++) { const d = Math.min(400, Math.ceil((target - moved) / 1)); await page.mouse.wheel(0, Math.min(d, 400)); moved += Math.min(d, 400); await page.waitForTimeout(70) } await page.waitForTimeout(700) }
  }
  const info = await page.evaluate((isPhone) => {
    cancelAnimationFrame(window.__raf)
    const f = window.__f.slice(5).sort((a, b) => a - b)
    const links = [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href').split('#')[0].split('?')[0]).filter(Boolean)
    const small = isPhone ? [...document.querySelectorAll('a, button')].filter((e) => { const r = e.getBoundingClientRect(); const st = getComputedStyle(e); return r.width > 0 && st.visibility !== 'hidden' && st.pointerEvents !== 'none' && (r.height < 30 || r.width < 30) && !e.closest('p, li, address, .sr-only, [aria-hidden=true]') }).map((e) => (e.textContent || e.getAttribute('aria-label') || e.className).trim().slice(0, 24)) : []
    const wide = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 2 && getComputedStyle(e).position !== 'fixed' && !e.closest('[aria-hidden=true], canvas, .sr-only') && e.children.length === 0 && (e.textContent || '').trim() }).slice(0, 4).map((e) => (e.textContent || '').trim().slice(0, 30))
    return { links: [...new Set(links)], overflow: document.documentElement.scrollWidth - innerWidth, noAlt: document.querySelectorAll('img:not([alt])').length, scrolled: Math.round(scrollY), h1: document.querySelectorAll('h1').length, title: document.title.length, desc: document.querySelector('meta[name=description]')?.content.length ?? 0, worst: Math.round(f.at(-1) ?? 0), p95: Math.round(f[Math.floor(f.length * 0.95)] ?? 0), small: [...new Set(small)].slice(0, 6), wide }
  }, phone).catch((e) => ({ links: [], err: e.message }))
  page.off('console', onC); page.off('pageerror', onE); page.off('requestfailed', onF); page.off('response', onR)
  if (!only) for (const l of info.links ?? []) if (!seen.has(l) && !/^\/(admin|api|buy|og)/.test(l)) { seen.add(l); queue.push(l) }
  const problems = [...(status >= 400 ? [`HTTP ${status}`] : []), ...new Set(errs), ...new Set(failed), ...(info.overflow > 1 ? [`sideways overflow ${info.overflow}px`] : []), ...(info.noAlt ? [`${info.noAlt} img without alt`] : []), ...(info.h1 !== 1 ? [`${info.h1} h1`] : []), ...(info.title > 65 ? [`title ${info.title} chars`] : []), ...(info.desc > 165 || info.desc < 70 ? [`description ${info.desc} chars`] : []), ...(height > vh * 1.5 && info.scrolled < 200 ? ['did not scroll'] : []), ...(info.small?.length ? ['small taps: ' + info.small.join(' | ')] : []), ...(info.wide?.length ? ['text past edge: ' + info.wide.join(' | ')] : [])]
  report.push({ path, h: Math.round(height / vh * 10) / 10, p95: info.p95, worst: info.worst, problems })
  console.log(path.padEnd(42), `screens ${String(Math.round(height / vh * 10) / 10).padEnd(5)} p95 ${String(info.p95).padEnd(4)} worst ${String(info.worst).padEnd(5)}`, problems.length ? '\n    ' + problems.slice(0, 8).join('\n    ') : 'ok')
}
await browser.close()
console.log('pages:', report.length, 'with problems:', report.filter((r) => r.problems.length).length)
