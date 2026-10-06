import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
await ctx.addInitScript(() => sessionStorage.setItem('platera:entered', '1'))
const page = await ctx.newPage()
await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 180000 })
await page.waitForTimeout(1500)
console.log(await page.evaluate(() => {
  const s = document.querySelector('#chapter-promises > .sticky')
  const cs = getComputedStyle(s)
  const b = [...document.querySelectorAll('.btn-primary')].map((x) => [x.textContent.trim().slice(0, 20), getComputedStyle(x).backgroundImage.slice(0, 40), getComputedStyle(x).backgroundColor])
  return { mask: cs.maskImage, anim: cs.animationName, timeline: cs.animationTimeline, mt: getComputedStyle(s.parentElement).marginTop, b }
}))
await browser.close()
