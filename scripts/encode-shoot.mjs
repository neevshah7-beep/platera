// The Platera campaign sitting: the best frames of the two shoots, encoded for The Sitting
// chapter. Writes public/media/shoot/<id>-{900,1600}.webp.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const out = 'public/media/shoot'
mkdirSync(out, { recursive: true })
const PICK = {
  merreeda: ['1. Merreeda Dress Full 1350 L 1', '2. Merreeda  E N R 1350 L 1', '3. Merreeda Ear Stud 1350 L 1', '4. Merreeda  Neck Lace 1350 L 1', '6. Merreeda Ring 1350 L 1', '8. Merreeda Ring 1350 L 3', '10. Merreeda Bangle 1350 L 2', '13. Merreeda Payal 1350 L 2'],
  aarya: ['1. Aarya Full 1350 L 1', '2. Aarya E N R 1350 L 1', '3. Aarya Stud 1350 L 1', '5. Aarya Stud 1350 L 3', '6. Aarya N Lace 1350 L 1', '9. Aarya  Bangle 1350 L 1', '12. Aarya Payal 1350 L 1', '14. Aarya 2 Full 1350 L', '15. Aarya 2 ENR 1350 L', '18. Aarya 2 Ear 1350 L 3', '19. Aarya 2 Necklace 1350 L 1', '21. Aarya 2 Ring 1350 L 1', '22. Aarya 2 Ring 1350 L 2', '24. Aarya 2 Banle 1350 L 2'],
}
for (const [model, names] of Object.entries(PICK)) {
  for (const n of names) {
    const id = `${model}-${n.replace(/^(\d+)\..*?(2 )?(\w+)?.*$/, '$1')}`.toLowerCase()
    for (const w of [900, 1600]) {
      await sharp(`assets/shoot/${model}/${n}.jpg`).resize({ width: w, withoutEnlargement: true }).webp({ quality: w === 900 ? 80 : 84 }).toFile(`${out}/${id}-${w}.webp`)
    }
    console.log(id, '←', n)
  }
}
