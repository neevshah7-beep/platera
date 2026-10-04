// End-to-end purchase against the local dev server with PAYMENTS_DEV_SIMULATE=1.
//   node scripts/e2e-purchase.mjs <piece-slug> <screenshotDir>
// Test buyer details below are fixtures for local runs only.
import { chromium } from 'playwright-core'

const [, , slug = 'station-chain-set', out = 'shots'] = process.argv
const base = process.env.SHOT_BASE ?? 'http://localhost:3000'
const buyer = { name: 'Test Buyer', phone: '9876543210', email: 'buyer@example.test', line1: '12 Test Road', city: 'Mumbai', pincode: '400091' }

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage()
const step = (s) => console.log('·', s)

await page.goto(`${base}/piece/${slug}`)
step(`PDP loaded: ${await page.locator('h1').innerText()}`)
await page.getByRole('button', { name: 'Add to bag' }).first().click()
await page.getByText('Added to your bag.').waitFor()
step('Added to bag')

await page.goto(`${base}/bag`)
await page.screenshot({ path: `${out}/e2e-1-bag.png`, fullPage: true })
await page.getByRole('link', { name: 'Continue to checkout' }).click()
await page.waitForURL('**/checkout')
step('At checkout')

await page.getByRole('button', { name: /^Pay/ }).click()
await page.getByText('Please check the highlighted fields.').waitFor()
step('Empty form rejected with field messages')

await page.getByLabel('Full name').fill(buyer.name)
await page.getByLabel('Mobile number').fill(buyer.phone)
await page.getByLabel('Email, for your receipt').fill(buyer.email)
await page.getByLabel('House, building, street').fill(buyer.line1)
await page.getByLabel('City').fill(buyer.city)
await page.getByLabel('PIN code').fill(buyer.pincode)
await page.getByLabel(/I’ve read these conditions/).check()
await page.screenshot({ path: `${out}/e2e-2-checkout.png`, fullPage: true })
await page.getByRole('button', { name: /^Pay/ }).click()
await page.waitForURL('**/checkout/pay/**')
step(`Payment page: ${page.url().split('/pay/')[1].split('?')[0]}`)

await page.getByRole('button', { name: 'Simulate a successful payment' }).click()
await page.waitForURL('**/order/**')
const heading = await page.locator('h1').innerText()
step(`Order page: "${heading}"`)
await page.screenshot({ path: `${out}/e2e-3-order.png`, fullPage: true })

await page.goto(`${base}/piece/${slug}`)
const sold = await page.getByText('Sold', { exact: true }).first().isVisible()
step(`PDP after purchase shows Sold: ${sold}`)
await page.goto(`${base}/bag`)
step(`Bag after purchase: "${await page.locator('h1').innerText()}"`)
await browser.close()
if (!heading.startsWith('Thank you') || !sold) process.exit(1)
