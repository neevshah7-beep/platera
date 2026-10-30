"""Finds the ring in each men's ring photo (rembg u2net, for its outline only) and saves a
close crop of the ORIGINAL photo around it (marble kept): assets/oct30-crops/mens/<n>.jpg,
plus the ring's box in the full photo in assets/oct30-crops/mens/boxes.json."""
import json, os, sys
import numpy as np
from PIL import Image, ImageOps
from rembg import remove, new_session

SRC = 'assets/raw/oct30/mens-rings/Mens ring'
OUT = 'assets/oct30-crops/mens'
os.makedirs(OUT, exist_ok=True)
session = new_session('u2net', providers=['CPUExecutionProvider'])
files = sorted(f for f in os.listdir(SRC) if f.lower().endswith('.jpg'))
boxes = {}
for n, f in enumerate(files):
    im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, f))).convert('RGB')
    small = im.copy(); small.thumbnail((688, 912))
    a = np.array(remove(small, session=session, only_mask=True))
    ys, xs = np.where(a > 128)
    s = im.width / small.width
    # The ring is the upper part of what the model finds (its reflection is below it).
    x0, x1, y0, y1 = xs.min() * s, xs.max() * s, ys.min() * s, ys.max() * s
    boxes[f] = [int(x0), int(y0), int(x1), int(y1)]
    cx, cy = (x0 + x1) / 2, y0 + (y1 - y0) * 0.35
    side = max(x1 - x0, (y1 - y0) * 0.7) * 1.35
    crop = im.crop((int(cx - side / 2), int(cy - side / 2), int(cx + side / 2), int(cy + side / 2))).resize((320, 320))
    crop.save(f'{OUT}/{n:03d}.jpg', quality=90)
    print(n, flush=True)
json.dump(boxes, open(f'{OUT}/boxes.json', 'w'))
