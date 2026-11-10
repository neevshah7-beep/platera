"""Finds the pair of leg rings in each photo (rembg u2net, outline only) and saves a close crop
of the ORIGINAL photo (satin kept) for grouping: assets/nov10-crops/<n>.jpg, numbered across
the three folders in order; writes assets/nov10-crops/index.json [[file, box], ...]."""
import json, os
import numpy as np
from PIL import Image, ImageOps
from rembg import remove, new_session

ROOT = 'assets/raw/nov10'
DIRS = ['Leg ring bichua', 'Leg ring 2', 'Leg ring 3']
OUT = 'assets/nov10-crops'
os.makedirs(OUT, exist_ok=True)
session = new_session('u2net', providers=['CPUExecutionProvider'])
index = []
for d in DIRS:
    for f in sorted(os.listdir(os.path.join(ROOT, d))):
        if not f.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        path = os.path.join(ROOT, d, f)
        im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
        small = im.copy(); small.thumbnail((688, 912))
        a = np.array(remove(small, session=session, only_mask=True))
        ys, xs = np.where(a > 128)
        s = im.width / small.width
        box = [int(xs.min() * s), int(ys.min() * s), int(xs.max() * s), int(ys.max() * s)]
        x0, y0, x1, y1 = box
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        side = max(x1 - x0, y1 - y0) * 1.25
        im.crop((int(cx - side / 2), int(cy - side / 2), int(cx + side / 2), int(cy + side / 2))).resize((320, 320)).save(f'{OUT}/{len(index):03d}.jpg', quality=90)
        index.append([os.path.join(d, f), box])
        print(len(index) - 1, flush=True)
json.dump(index, open(f'{OUT}/index.json', 'w'))
