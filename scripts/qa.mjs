// Laptop QA sweep: crawls every internal page from the home page and checks, at 1366×768,
// 1440×900 and 1536×864: HTTP status, console errors, page errors, failed requests,
// horizontal overflow, images without alt, and links that 404.
import { chromium } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3000'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } })
const page = await ctx.newPage()
const seen = new Set(['/'])
const queue = ['/']
const issues = []
const ignore = (t) => /X4122|X3595|Download the React DevTools|Fast Refresh|webpack-hmr|PCFSoftShadowMap|THREE.Clock/.test(t)
while (queue.length && seen.size < 80) {
  const path = queue.shift()
  const errs = []
  const failed = []
  const onC = (m) => m.type() === 'error' && !ignore(m.text()) && errs.push(m.text().slice(0, 200))
  const onE = (e) => errs.push('pageerror: ' + e.message.slice(0, 200))
  const onF = (r) => !r.url().includes('_next/webpack') && failed.push(r.url().replace(base, '') + ' ' + (r.failure()?.errorText ?? ''))
  const onR = (r) => r.status() >= 400 && r.url().startsWith(base) && failed.push(r.url().replace(base, '') + ' HTTP ' + r.status())
  page.on('console', onC); page.on('pageerror', onE); page.on('requestfailed', onF); page.on('response', onR)
  let status = 0
  try {
    const res = await page.goto(base + path, { waitUntil: 'load', timeout: 120_000 })
    status = res?.status() ?? 0
    await page.waitForTimeout(1500)
  } catch (e) { errs.push('nav: ' + e.message.slice(0, 120)) }
  const info = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href').split('#')[0].split('?')[0]).filter(Boolean)
    const overflow = document.documentElement.scrollWidth - innerWidth
    const noAlt = [...document.querySelectorAll('img:not([alt])')].length
    return { links: [...new Set(links)], overflow, noAlt }
  }).catch(() => ({ links: [], overflow: 0, noAlt: 0 }))
  for (const l of info.links) if (!seen.has(l) && !l.startsWith('/admin') && !l.startsWith('/api')) { seen.add(l); queue.push(l) }
  const sizes = []
  for (const vp of [{ width: 1440, height: 900 }, { width: 1536, height: 864 }]) {
    await page.setViewportSize(vp)
    await page.waitForTimeout(300)
    const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth).catch(() => 0)
    if (o > 1) sizes.push(`${vp.width}: overflow ${o}px`)
  }
  await page.setViewportSize({ width: 1366, height: 768 })
  page.off('console', onC); page.off('pageerror', onE); page.off('requestfailed', onF); page.off('response', onR)
  const problems = [...(status >= 400 ? [`HTTP ${status}`] : []), ...errs, ...failed, ...(info.overflow > 1 ? [`1366: overflow ${info.overflow}px`] : []), ...sizes, ...(info.noAlt ? [`${info.noAlt} img without alt`] : [])]
  if (problems.length) issues.push({ path, problems: [...new Set(problems)].slice(0, 8) })
}
await browser.close()
console.log('pages checked:', seen.size)
console.log(JSON.stringify(issues, null, 1))
