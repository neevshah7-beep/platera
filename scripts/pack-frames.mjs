// Packs each rendered frame sequence (public/scenes/<scene>/<width>/NNNN.webp) into one
// file, so a visitor downloads a scene in a single request instead of ~150. Hundreds of
// requests from one address in a few seconds made Vercel's attack protection block
// visitors who share an address (mobile networks, office and home Wi-Fi).
//
// Format: "PLTP" · u32 frame count · u32 byte length of each frame · the WebP files back
// to back (little-endian). The name carries a content hash, so it can be cached forever;
// src/scenes/packs.json maps "<scene>/<width>" to the current file.
//   node scripts/pack-frames.mjs        (run after scripts/encode-frames.mjs)
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'public/scenes'
const packs = {}
for (const scene of readdirSync(ROOT)) {
  const dir = join(ROOT, scene)
  if (!statSync(dir).isDirectory()) continue
  // Old packs of this scene go first, so only the current one is published.
  for (const f of readdirSync(dir)) if (f.endsWith('.pack')) rmSync(join(dir, f))
  for (const width of readdirSync(dir)) {
    const frames = join(dir, width)
    if (!statSync(frames).isDirectory()) continue
    const files = readdirSync(frames).filter((f) => /^\d{4}\.webp$/.test(f)).sort()
    const bodies = files.map((f) => readFileSync(join(frames, f)))
    const head = Buffer.alloc(8 + 4 * bodies.length)
    head.write('PLTP', 0, 'ascii')
    head.writeUInt32LE(bodies.length, 4)
    bodies.forEach((b, i) => head.writeUInt32LE(b.length, 8 + 4 * i))
    const pack = Buffer.concat([head, ...bodies])
    const hash = createHash('sha256').update(pack).digest('hex').slice(0, 10)
    const name = `${width}.${hash}.pack`
    writeFileSync(join(dir, name), pack)
    packs[`${scene}/${width}`] = `/scenes/${scene}/${name}`
    console.log(`${scene}/${width}`.padEnd(24), String(bodies.length).padStart(4), 'frames', (pack.length / 1048576).toFixed(2), 'MB')
  }
}
writeFileSync('src/scenes/packs.json', JSON.stringify(packs, null, 2) + '\n')
console.log('wrote src/scenes/packs.json')
