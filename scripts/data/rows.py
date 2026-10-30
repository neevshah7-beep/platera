"""Draws candidate groups as rows of large crops for checking by eye.
python scripts/data/rows.py <crop_dir> <groups.txt> <out_prefix>
groups.txt: one group per line, photo numbers separated by spaces (# comments allowed)."""
import os, sys
from PIL import Image, ImageDraw
d, gfile, out = sys.argv[1:4]
groups = []
for line in open(gfile):
    line = line.split('#')[0].strip()
    if line: groups.append([int(x) for x in line.split()])
W = 210
per = 9
for p in range(0, len(groups), per):
    ch = groups[p:p + per]
    cols = max(len(g) for g in ch)
    s = Image.new('RGB', (W * cols + 60, W * len(ch)), 'white'); dr = ImageDraw.Draw(s)
    for r, g in enumerate(ch):
        dr.text((4, r * W + 90), f'G{p + r}', fill='blue')
        for c, n in enumerate(g):
            ext = '.jpg'
            im = Image.open(os.path.join(d, f'{n:03d}{ext}')).resize((W - 6, W - 6))
            s.paste(im, (60 + c * W, r * W + 3)); dr.rectangle([60 + c * W, r * W + 3, 60 + c * W + 30, r * W + 17], fill='white'); dr.text((62 + c * W, r * W + 4), str(n), fill='red')
    s.save(f'{out}-{p // per}.jpg', quality=85)
print(len(groups), 'groups,', sum(len(g) for g in groups), 'photos')
