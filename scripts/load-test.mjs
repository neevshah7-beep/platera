// Simulates N visitors arriving at once: each loads the homepage, the rings page, a piece,
// the buy page, a share card and a run of 3D frames. Reports timings and status codes.
//   node scripts/load-test.mjs [visitors]      (BASE=https://www.platerajewellers.in)
import { readFileSync } from 'node:fs'
const packs = JSON.parse(readFileSync('src/scenes/packs.json', 'utf8'))
const B = process.env.BASE ?? 'https://www.platerajewellers.in'
const N = Number(process.argv[2] ?? 40)
const key = (u) => u.replace(/\?.*/, '').replace(/\.[0-9a-f]{10}\.pack$/, '.pack')

const t = async (u) => {
  const s = performance.now()
  try {
    const r = await fetch(B + u)
    await r.arrayBuffer()
    return [r.status, performance.now() - s]
  } catch (e) {
    return [`ERR ${e.cause?.code ?? e.message}`, performance.now() - s]
  }
}

const visitor = async (i) => {
  // A phone visitor now: the pages, then the three packed scenes (scripts/pack-frames.mjs).
  const urls = ['/', '/rings', `/piece/filigree-heart-ring?v=${i}`, '/buy/scroll-crown-ring', '/og/star-heart-ring',
    packs['fall_portrait/1600'], packs['stamp_portrait/1600'], packs['gift_portrait/1600']]
  const out = []
  for (const u of urls) out.push([u, ...(await t(u))])
  return out
}

const s = performance.now()
const all = (await Promise.all(Array.from({ length: N }, (_, i) => visitor(i)))).flat()
const codes = {}
const times = {}
for (const [u, st, ms] of all) {
  codes[`${key(u)} ${st}`] = (codes[`${key(u)} ${st}`] ?? 0) + 1
  ;(times[key(u)] ??= []).push(ms)
}
for (const [k, v] of Object.entries(times)) {
  v.sort((a, b) => a - b)
  console.log(k.padEnd(32), 'median', Math.round(v[v.length >> 1]), 'ms  worst', Math.round(v.at(-1)), 'ms')
}
console.log(codes)
const bad = all.filter(([, st]) => typeof st !== 'number' || st >= 400).length
console.log(N, 'visitors,', all.length, 'requests,', bad, 'failed, total', Math.round(performance.now() - s), 'ms')
