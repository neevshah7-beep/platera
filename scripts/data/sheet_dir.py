"""Numbered contact sheets of a photo folder: python scripts/data/sheet_dir.py <dir> <name> [per_page]"""
import os, sys
from PIL import Image, ImageDraw, ImageOps
d, name = sys.argv[1], sys.argv[2]
per = int(sys.argv[3]) if len(sys.argv) > 3 else 48
fs = sorted(f for f in os.listdir(d) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.heic')))
W, H, C = 220, 290, 8
for p in range(0, len(fs), per):
    chunk = fs[p:p + per]
    s = Image.new('RGB', (W * C, H * ((len(chunk) + C - 1) // C)), 'white'); dr = ImageDraw.Draw(s)
    for n, f in enumerate(chunk):
        im = ImageOps.exif_transpose(Image.open(os.path.join(d, f))).convert('RGB'); im.thumbnail((W - 6, H - 20))
        x, y = (n % C) * W, (n // C) * H
        s.paste(im, (x + 3, y + 3)); dr.text((x + 4, y + H - 16), f'{p + n} {im.size}', fill='red')
    s.save(f'look/oct30/{name}-{p // per}.jpg', quality=82)
print(len(fs))
