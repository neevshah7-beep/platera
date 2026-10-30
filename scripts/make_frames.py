"""
THE FRAMES (2026-10-30). Rings, pendants and bangles are shown in their original photographs
(the client's wish: no cut-outs, no 3D), framed close on the piece. For each piece this writes
its main image, assets/prepared/<SKU>-01.png, as a 4:5 crop of its first photograph:

  rings 001-021, 024-083  the first studio photograph (scripts/oct23_rings.py), centred on the ring
  men's rings 084-153     the first photograph of each (scripts/data/mens-final.txt), centred on the ring
  rings 022-023, pendants the first store photograph (assets/sorted), as photographed
  bangles                 the first store photograph of each design (assets/sorted, PLT-BNG-*)

The ring is found with rembg u2net (its outline only; nothing is cut out) and the frame is
about 1.7 rings wide: the ring fills the frame, with marble around it.
Also copies the bangle photographs into assets/sorted as PLT-BNG-<nnn>-<mm>.jpg and writes
scripts/data/mens.json { SKU: [photo file, ...] } for the studio galleries.
    python scripts/make_frames.py
"""
import json, os, sys, shutil
import numpy as np
from PIL import Image, ImageOps
from rembg import remove, new_session

sys.path.insert(0, os.path.dirname(__file__))
from oct23_rings import RINGS, FOLDERS

PREP = 'assets/prepared'
MENS = 'assets/raw/oct30/mens-rings/Mens ring'
BANG = 'assets/raw/oct30/bangles/Bangles size2-6'
session = new_session('u2net', providers=['CPUExecutionProvider'])


def ring_box(im):
    small = im.copy(); small.thumbnail((688, 912))
    a = np.array(remove(small, session=session, only_mask=True))
    ys, xs = np.where(a > 128)
    s = im.width / small.width
    x0, x1, y0, y1 = xs.min() * s, xs.max() * s, ys.min() * s, ys.max() * s
    # What the model finds includes the ring's mirror image below it; the ring is the top part.
    h = (y1 - y0)
    return x0, y0, x1, y0 + h * 0.62


def frame_on(im, box, rings_wide=1.7):
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 + (y1 - y0) * 0.12
    w = max((x1 - x0) * rings_wide, (y1 - y0) * rings_wide * 0.8, 360)
    w = min(w, im.width, im.height * 0.8)
    h = w * 1.25
    left = min(max(0, cx - w / 2), im.width - w)
    top = min(max(0, cy - h / 2), im.height - h)
    return im.crop((int(left), int(top), int(left + w), int(top + h)))


def frame_whole(im):
    """A 4:5 crop from the middle of a store photograph."""
    w, h = im.size
    if w / h > 0.8:
        nw = h * 0.8; return im.crop((int((w - nw) / 2), 0, int((w + nw) / 2), h))
    nh = w * 1.25; return im.crop((0, int((h - nh) / 2), w, int((h + nh) / 2)))


def save(sku, im):
    im.convert('RGB').save(f'{PREP}/{sku}-01.png')
    print(sku, im.size, flush=True)


def main():
    files = {k: sorted(os.listdir(f'assets/raw/oct23/{v}')) for k, v in FOLDERS.items()}
    for sku, photos in RINGS.items():
        k, i = photos[0]
        im = ImageOps.exif_transpose(Image.open(f'assets/raw/oct23/{FOLDERS[k]}/{files[k][i]}')).convert('RGB')
        save(sku, frame_on(im, ring_box(im)))

    mens = sorted(f for f in os.listdir(MENS) if f.lower().endswith('.jpg'))
    groups = [[int(x) for x in l.split('#')[0].split()] for l in open('scripts/data/mens-final.txt') if l.split('#')[0].strip()]
    table = {}
    for n, g in enumerate(groups):
        sku = f'PLT-RNG-{84 + n:03d}'
        table[sku] = [mens[i] for i in g]
        im = ImageOps.exif_transpose(Image.open(os.path.join(MENS, mens[g[0]]))).convert('RGB')
        save(sku, frame_on(im, ring_box(im)))
    json.dump(table, open('scripts/data/mens.json', 'w'), indent=1)

    bang = sorted(os.listdir(BANG))
    bgroups = [[int(x) for x in l.split()] for l in open('scripts/data/bangles-final.txt') if l.strip()]
    for n, g in enumerate(bgroups):
        sku = f'PLT-BNG-{n + 1:03d}'
        for m, i in enumerate(g):
            shutil.copyfile(os.path.join(BANG, bang[i]), f'assets/sorted/{sku}-{m + 1:02d}.jpg')

    for sku in ['PLT-RNG-022', 'PLT-RNG-023'] + [f'PLT-PND-{n:03d}' for n in range(1, 11)] + [f'PLT-BNG-{n + 1:03d}' for n in range(len(bgroups))]:
        im = ImageOps.exif_transpose(Image.open(f'assets/sorted/{sku}-01.jpg')).convert('RGB')
        save(sku, frame_whole(im))


if __name__ == '__main__':
    main()
