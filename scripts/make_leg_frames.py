"""
Leg rings (2026-11-10): three Drive folders of pairs photographed on ivory satin, grouped into
designs in scripts/data/leg-final.txt (photo numbers across the folders in order; see
scripts/data/crop_pairs_nov10.py). Shown in their photographs, like the rings: no cut-out.

  · assets/prepared/PLT-LGR-<nnn>-01.png  a 4:5 crop of the design's first photograph, framed on the pair
  · scripts/data/leg.json                 { SKU: [photo path, ...] } for the studio gallery
    python scripts/make_leg_frames.py
"""
import json, os
from PIL import Image, ImageOps

ROOT = 'assets/raw/nov10'
index = json.load(open('assets/nov10-crops/index.json'))
groups = [[int(x) for x in l.split()] for l in open('scripts/data/leg-final.txt') if l.strip()]


def frame(im, box, wide=1.15):
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    w = min(max((x1 - x0) * wide, (y1 - y0) * wide * 0.8, 360), im.width, im.height * 0.8)
    h = w * 1.25
    left = min(max(0, cx - w / 2), im.width - w)
    top = min(max(0, cy - h / 2), im.height - h)
    return im.crop((int(left), int(top), int(left + w), int(top + h)))


table = {}
for n, g in enumerate(groups):
    sku = f'PLT-LGR-{n + 1:03d}'
    table[sku] = [index[i][0] for i in g]
    path, box = index[g[0]]
    im = ImageOps.exif_transpose(Image.open(os.path.join(ROOT, path))).convert('RGB')
    frame(im, box).save(f'assets/prepared/{sku}-01.png')
    print(sku, flush=True)
json.dump(table, open('scripts/data/leg.json', 'w'), indent=1)
