// Tells IndexNow search engines (Bing, Yandex, Seznam, Naver…) about every page in the
// sitemaps at once. Run after publishing changes:  node scripts/indexnow.mjs
// The key is public by design: it is served at /b843ff588c4728fbdf642b1850fa5db1.txt to prove the site is ours.
const KEY = 'b843ff588c4728fbdf642b1850fa5db1'
const HOST = 'www.platerajewellers.in'
const urls = []
for (const id of ['pages', 'categories', 'pieces']) {
  const xml = await (await fetch(`https://${HOST}/sitemap/${id}.xml`)).text()
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.push(m[1])
}
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
})
console.log(urls.length, 'urls ->', res.status, await res.text())
