"""
Ring cut-outs, second method (2026-10-23): BiRefNet (rembg 'birefnet-general'), which separates
the ring from the marble AND from the ring's mirror reflection in it, so no reflection
heuristics or straight trims are needed (those chopped rings flat at the bottom).

Cuts every photo of every ring in scripts/oct23_rings.py to assets/oct23-bire/<SKU>-<n>.png
(n = position in that ring's list; only the display photo, n = 0, unless --all), cropped to the ring.
    python scripts/ring_cutout_v2.py [SKU ...]
"""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
from rembg import remove, new_session

sys.path.insert(0, os.path.dirname(__file__))
from oct23_rings import RINGS, FOLDERS

OUT = 'assets/oct23-bire'
ALL = '--all' in sys.argv


def tidy(cut: Image.Image) -> Image.Image:
    """Drop specks apart from the ring, and crop to it with a 3% margin."""
    a = np.array(cut)
    solid = a[..., 3] >= 128
    lab, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 0.02 * sizes.max()])
        near = ndimage.binary_dilation(keep, iterations=6)
        a[..., 3] = np.where(near, a[..., 3], 0)
    ys, xs = np.where(a[..., 3] >= 128)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    pad = int(0.03 * max(y1 - y0, x1 - x0))
    return Image.fromarray(a).crop((max(0, x0 - pad), max(0, y0 - pad), min(a.shape[1], x1 + pad), min(a.shape[0], y1 + pad)))


def main():
    os.makedirs(OUT, exist_ok=True)
    session = new_session('birefnet-general', providers=['CPUExecutionProvider'])
    files = {k: sorted(os.listdir(f'assets/raw/oct23/{v}')) for k, v in FOLDERS.items()}
    want = [a for a in sys.argv[1:] if a.startswith('PLT-')] or list(RINGS)
    for sku in want:
        for n, (k, i) in enumerate(RINGS[sku] if ALL else RINGS[sku][:1]):
            dst = f'{OUT}/{sku}-{n}.png'
            if os.path.exists(dst):
                continue
            im = Image.open(f'assets/raw/oct23/{FOLDERS[k]}/{files[k][i]}').convert('RGB')
            tidy(remove(im, session=session)).save(dst)
        print(sku, flush=True)


if __name__ == '__main__':
    main()
