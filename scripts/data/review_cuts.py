import glob, os, sys
from PIL import Image, ImageDraw
fs = sorted(glob.glob('assets/prepared/PLT-RNG-*-01.png'))
W, H, C = 420, 300, 4
for page in range(0, len(fs), 16):
    chunk = fs[page:page + 16]
    sheet = Image.new('RGB', (W * C, H * ((len(chunk) + C - 1) // C)), (246, 239, 224))
    d = ImageDraw.Draw(sheet)
    for n, f in enumerate(chunk):
        im = Image.open(f).convert('RGBA'); im.thumbnail((W - 20, H - 30))
        x, y = (n % C) * W, (n // C) * H
        sheet.paste(im, (x + (W - im.width) // 2, y + 6), im)
        d.text((x + 6, y + H - 20), os.path.basename(f)[8:11], fill=(120, 60, 30))
    sheet.save(f'look/oct23/review-{page // 16}.jpg', quality=88)
