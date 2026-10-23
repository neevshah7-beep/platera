"""Crops the oct23 ring cut-outs to the part that is clearly there (alpha >= 50%), with a
small margin, so a ring's lowest visible point is the bottom of its image. Faint remains of
the marble's reflection below that are cleared."""
import glob, os, numpy as np
from PIL import Image
for f in sorted(glob.glob('assets/oct23-cut/*.png')):
    im = Image.open(f).convert('RGBA'); a = np.array(im)
    m = a[..., 3] >= 128
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    a[y1 + 2:, :, 3] = 0  # nothing faint below the ring
    pad = int(0.02 * max(y1 - y0, x1 - x0))
    out = Image.fromarray(a).crop((max(0, x0 - pad), max(0, y0 - pad), min(a.shape[1], x1 + pad), min(a.shape[0], y1 + pad)))
    sku = os.path.basename(f)[:-4]
    out.save(f'assets/prepared/{sku}-01.png')
    print(sku, im.size, '->', out.size)
