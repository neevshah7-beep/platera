// Screenshots one homepage chapter in fine steps on several phone sizes.
//   CHAPTER=chapter-journey STEPS=10 node scripts/look-chapter.mjs     (BASE)
import { chromium, devices } from 'playwright-core'
import { mkdirSync } from 'node:fs'
const base = process.env.BASE ?? 'https://www.platerajewellers.in'
const CH = process.env.CHAPTER ?? 'chapter-journey'
const STEPS = Number(process.env.STEPS ?? 10)
mkdirSync('look/chapter', { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
for (const [name, vp, dpr] of [['360', { width: 360, height: 740 }, 3], ['393', { width: 393, height: 786 }, 2.75], ['430', { width: 430, height: 880 }, 3]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, userAgent: devices['Pixel 7'].userAgent })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
  const page = await ctx.newPage()
  await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(2000)
  const { top, h } = await page.evaluate((id) => { const s = document.getElementById(id); return { top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight } }, CH)
  await page.evaluate((y) => scrollTo(0, y), top - vp.height); await page.waitForTimeout(2500)
  for (let i = 0; i < STEPS; i++) {
    await page.evaluate((y) => scrollTo(0, y), top + ((h - vp.height) * i) / (STEPS - 1)); await page.waitForTimeout(1300)
    const cut = await page.evaluate((id) => { const out = []; for (const el of document.querySelectorAll(`#${id} h2, #${id} h3, #${id} p, #${id} span, #${id} li`)) { const s = getComputedStyle(el); if (+s.opacity < 0.4 || s.visibility === 'hidden' || el.closest('[aria-hidden=true]')) continue; const b = el.getBoundingClientRect(); if (b.width < 2 || b.bottom < 0 || b.top > innerHeight) continue; const t = (el.textContent || '').trim().slice(0, 26); if (t && (b.left < -1 || b.right > innerWidth + 1)) out.push(`${t} [${Math.round(b.left)}..${Math.round(b.right)}]`) } return out }, CH)
    if (cut.length) console.log(name, 'step', i, 'CUT:', cut.join(' | '))
    await page.screenshot({ path: `look/chapter/${name}-${String(i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 55 })
  }
  await ctx.close()
}
await browser.close()
