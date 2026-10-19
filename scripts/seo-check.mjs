// Technical SEO pass over every URL in the live sitemaps: status, canonical, robots,
// title and description length and uniqueness, one H1, image alt text, structured data
// that parses, Open Graph image, plus site-wide checks (redirects, 404s, robots.txt).
const B = process.env.BASE ?? 'https://www.platerajewellers.in'
const get = async (u, opts) => { const r = await fetch(u, { redirect: 'manual', ...opts }); return { status: r.status, loc: r.headers.get('location'), text: r.status === 200 ? await r.text() : '' , headers: r.headers } }
const urls = []
for (const id of ['pages', 'categories', 'pieces']) for (const m of (await get(`${B}/sitemap/${id}.xml`)).text.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.push(m[1])
const titles = {}, descs = {}, problems = []
const one = (re, s) => s.match(re)?.[1]
await Promise.all(urls.map(async (u) => {
  const r = await get(u)
  const p = []
  if (r.status !== 200) { problems.push([u, [`HTTP ${r.status} ${r.loc ?? ''}`]]); return }
  const h = r.text
  const title = one(/<title>([^<]*)<\/title>/, h) ?? ''
  const desc = one(/<meta name="description" content="([^"]*)"/, h) ?? ''
  const canon = one(/<link rel="canonical" href="([^"]*)"/, h)
  const robots = one(/<meta name="robots" content="([^"]*)"/, h) ?? ''
  const h1 = (h.match(/<h1[\s>]/g) ?? []).length
  const imgs = [...h.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
  const noAlt = imgs.filter((i) => !/\salt="/.test(i)).length
  const lds = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1])
  const badLd = lds.filter((s) => { try { JSON.parse(s); return false } catch { return true } }).length
  const og = one(/<meta property="og:image" content="([^"]*)"/, h)
  ;(titles[title] ??= []).push(u); (descs[desc] ??= []).push(u)
  if (!canon) p.push('no canonical'); else if (canon.replace(/\/$/, '') !== u.replace(/\/$/, '')) p.push(`canonical -> ${canon}`)
  if (/noindex/.test(robots)) p.push('noindex')
  if (title.length < 25 || title.length > 65) p.push(`title ${title.length} chars`)
  if (desc.length < 70 || desc.length > 165) p.push(`description ${desc.length} chars`)
  if (h1 !== 1) p.push(`${h1} h1`)
  if (noAlt) p.push(`${noAlt} img without alt`)
  if (!lds.length) p.push('no structured data'); if (badLd) p.push(`${badLd} broken JSON-LD`)
  if (!og) p.push('no og:image')
  if (p.length) problems.push([u, p])
}))
for (const [t, us] of Object.entries(titles)) if (us.length > 1) problems.push([`duplicate title "${t.slice(0, 50)}"`, us.map((x) => x.replace(B, ''))])
for (const [t, us] of Object.entries(descs)) if (us.length > 1) problems.push([`duplicate description "${t.slice(0, 50)}"`, us.map((x) => x.replace(B, ''))])
const site = [
  ['http://platerajewellers.in/', 'redirect'], ['https://platerajewellers.in/', 'redirect'], ['http://www.platerajewellers.in/', 'redirect'],
  [`${B}/this-page-does-not-exist`, 404], [`${B}/piece/not-a-piece`, 404], [`${B}/robots.txt`, 200], [`${B}/manifest.webmanifest`, 200],
  [`${B}/opengraph-image.jpg`, 200], [`${B}/collection/`, 'redirect'], [`${B}/bag`, 'redirect'],
]
for (const [u, want] of site) {
  const r = await get(u)
  const ok = want === 'redirect' ? r.status >= 300 && r.status < 400 : r.status === want
  console.log(ok ? 'ok  ' : 'FAIL', String(r.status).padEnd(4), u.replace('https://', '').padEnd(48), r.loc ? '-> ' + r.loc : '')
}
const home = await get(B + '/')
console.log('hsts:', home.headers.get('strict-transport-security') ? 'yes' : 'no', '| html lang:', one(/<html lang="([^"]+)"/, home.text), '| viewport:', /name="viewport"/.test(home.text) ? 'yes' : 'no')
console.log(urls.length, 'sitemap URLs checked;', problems.length, 'with notes')
for (const [u, p] of problems) console.log('-', u.replace(B, ''), '\n    ', p.join(' | '))
