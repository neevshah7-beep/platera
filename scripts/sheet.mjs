// Contact sheet of screenshots, for reviewing a sequence at a glance.
//   node scripts/sheet.mjs <out.png> <cols> <tileWidth> <file>...
import sharp from 'sharp'

const [out, cols = '3', tw = '640', ...files] = process.argv.slice(2)
const c = Number(cols), w = Number(tw)
const metas = await Promise.all(files.map((f) => sharp(f).metadata()))
const h = Math.round((w * metas[0].height) / metas[0].width)
const tiles = await Promise.all(files.map(async (f, i) => ({ input: await sharp(f).resize(w, h).toBuffer(), left: (i % c) * w, top: Math.floor(i / c) * h })))
await sharp({ create: { width: c * w, height: Math.ceil(files.length / c) * h, channels: 3, background: '#000' } }).composite(tiles).png().toFile(out)
console.log(out, files.length)
