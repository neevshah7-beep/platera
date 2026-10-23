"""Review sheets of the BiRefNet cut-outs: each ring large, on cream (the site) and on dark red
(shows any leftover marble). python scripts/data/review_bire.py <first> <last>  (ring numbers)"""
import os, sys
from PIL import Image, ImageDraw
a, b = int(sys.argv[1]), int(sys.argv[2])
fs = [f'assets/oct23-bire/PLT-RNG-{n:03d}-0.png' for n in range(a, b + 1)]
fs = [f for f in fs if os.path.exists(f)]
W, H = 440, 260
sheet = Image.new('RGB', (W * 4, H * ((len(fs) + 1) // 2)), (255, 255, 255))
d = ImageDraw.Draw(sheet)
for n, f in enumerate(fs):
    im = Image.open(f).convert('RGBA'); im.thumbnail((W - 16, H - 24))
    for j, col in enumerate([(246, 239, 224), (110, 58, 50)]):
        x, y = ((n % 2) * 2 + j) * W, (n // 2) * H
        sheet.paste(Image.new('RGB', (W, H), col), (x, y))
        sheet.paste(im, (x + (W - im.width) // 2, y + 4), im)
        d.text((x + 6, y + H - 18), os.path.basename(f)[8:11], fill=(255, 255, 255) if j else (120, 60, 30))
sheet.save(f'look/oct23/bire-{a}-{b}.jpg', quality=88)
