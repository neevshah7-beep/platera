"""
Per-photo surface maps (Experience Bible §9). For every prepared cut-out in assets/prepared:

  DEPTH     Depth-Anything-V2-small (ONNX, run locally) on the photo, masked by the cut-out's
            alpha and blended with a distance-transform dome so thin chains still read round.
  NORMAL    from a height field = depth (form) + a Sobel-filtered luminance high-pass (the
            micro-relief of links, settings and stones). This is what lets a flat photograph
            take a moving highlight under the Lamp.
  ROUGHNESS bright, saturated or high-contrast pixels (polish, stone facets) are smooth;
            flat mid-tones are rougher.

Writes public/media/products/<name>-normal.webp and <name>-dr.webp (R = depth, G = roughness,
B = 0), at most 1024 px on the long side, and src/data/maps-manifest.json with each photo's
source resolution and a re-shoot flag when the original is below 1600 px on its long side.

Run:  python src/pipeline/make-maps.py
"""
import glob
import json
import os
import sys

import numpy as np
import onnxruntime as ort
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL = os.path.join(ROOT, 'assets', 'models', 'depth_anything_v2_small_q.onnx')
OUT = os.path.join(ROOT, 'public', 'media', 'products')
SORTED = os.path.join(ROOT, 'assets', 'sorted')
MAX = 1024
LOW_RES = 1600

session = ort.InferenceSession(MODEL, providers=['CPUExecutionProvider'])
MEAN = np.array([0.485, 0.456, 0.406], np.float32)
STD = np.array([0.229, 0.224, 0.225], np.float32)


def depth_of(rgb: np.ndarray) -> np.ndarray:
    h, w = rgb.shape[:2]
    s = 518 / max(h, w)
    th, tw = max(14, round(h * s / 14) * 14), max(14, round(w * s / 14) * 14)
    x = np.asarray(Image.fromarray(rgb).resize((tw, th), Image.BICUBIC), np.float32) / 255
    x = ((x - MEAN) / STD).transpose(2, 0, 1)[None]
    d = session.run(None, {'pixel_values': x})[0][0]
    d = np.asarray(Image.fromarray(d.astype(np.float32)).resize((w, h), Image.BICUBIC))
    return d


def norm01(a, mask):
    v = a[mask]
    if v.size == 0:
        return np.zeros_like(a)
    lo, hi = np.percentile(v, 2), np.percentile(v, 98)
    return np.clip((a - lo) / max(hi - lo, 1e-6), 0, 1)


def process(path: str, manifest: dict):
    name = os.path.splitext(os.path.basename(path))[0]
    im = Image.open(path).convert('RGBA')
    s = MAX / max(im.size)
    if s < 1:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    a = np.asarray(im, np.float32) / 255
    rgb, alpha = a[..., :3], a[..., 3]
    mask = alpha > 0.5

    # Form: the model's depth inside the piece, plus a dome so every strand is rounded.
    d = norm01(depth_of((rgb * 255).astype(np.uint8)), mask)
    dome = ndimage.distance_transform_edt(mask)
    dome = np.sqrt(np.clip(dome / max(np.percentile(dome[mask], 95) if mask.any() else 1, 1), 0, 1))
    form = (0.55 * d + 0.45 * dome) * alpha

    # Micro-relief: luminance high-pass, which carries the links, beads and stone facets.
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    detail = lum - ndimage.gaussian_filter(lum, 3)
    height = ndimage.gaussian_filter(form, 1.2) * 6 + detail * 3
    gx = ndimage.sobel(height, axis=1)
    gy = ndimage.sobel(height, axis=0)
    n = np.dstack([-gx, gy, np.full_like(gx, 1.0)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    normal = ((n * 0.5 + 0.5) * 255).astype(np.uint8)
    normal[~mask] = (128, 128, 255)

    # Roughness: polish and facets are smooth.
    sat = rgb.max(2) - rgb.min(2)
    local_contrast = np.sqrt(np.clip(ndimage.gaussian_filter(detail ** 2, 2), 0, None))
    smooth = np.clip(lum ** 1.6 * 0.7 + sat * 0.6 + local_contrast * 6, 0, 1)
    rough = np.clip(0.75 - smooth * 0.65, 0.08, 0.8)

    dr = np.dstack([form * 255, rough * 255 * alpha, np.zeros_like(form)]).astype(np.uint8)
    Image.fromarray(normal, 'RGB').save(os.path.join(OUT, f'{name}-normal.webp'), quality=88, method=6)
    Image.fromarray(dr, 'RGB').save(os.path.join(OUT, f'{name}-dr.webp'), quality=90, method=6)

    src = next(iter(glob.glob(os.path.join(SORTED, name + '.*'))), None)
    sw, sh = Image.open(src).size if src else (0, 0)
    manifest[name] = {'sourceWidth': sw, 'sourceHeight': sh, 'reshoot': max(sw, sh) < LOW_RES, 'maps': True}
    print(name, im.size, 'source', (sw, sh), 'RESHOOT' if manifest[name]['reshoot'] else '')


if __name__ == '__main__':
    manifest: dict = {}
    files = sorted(glob.glob(os.path.join(ROOT, 'assets', 'prepared', '*.png')))
    only = sys.argv[1:]
    for f in files:
        if only and not any(o in f for o in only):
            continue
        process(f, manifest)
    with open(os.path.join(ROOT, 'src', 'data', 'maps-manifest.json'), 'w') as fh:
        json.dump(manifest, fh, indent=2)
