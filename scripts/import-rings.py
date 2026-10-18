"""
Brings the ring shoot (iPhone HEIC and ProRAW DNG, 2026-10-17) into the photo pipeline.

Each ring sits small in the middle of a 3024x4032 frame on grey card. The photo is
cropped to 3:4 around the ring, background kept exactly as shot, and saved where the
rest of the catalogue's originals live:

  assets/raw/rings/<camera name>  →  assets/sorted/PLT-RNG-{nnn}-{nn}.jpg

The ring is found with the same segmentation model as prepare-photos.py, on a
downscaled copy. Then run, in order:

  python scripts/prepare-photos.py --only PLT-RNG-001-01 ...   (cut-out, first photo of each ring)
  python scripts/import-rings.py --trim                          (crops those cut-outs to the ring)
  npm run images && node scripts/encode-originals.mjs

Usage: python scripts/import-rings.py [--trim]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

SRC = Path('assets/raw/rings')
OUT = Path('assets/sorted')
PREPARED = Path('assets/prepared')

# Ring number → its photos, best front view first. Weight-named DNGs that are byte
# copies of an IMG_ file (1.870, 2.460, 2.690, 1.720, 2.700) are listed once.
RINGS = {
    1: ['IMG_7416.DNG', 'IMG_7414.DNG', 'IMG_7415.DNG'],
    2: ['1.870gms.DNG'],
    3: ['IMG_7420.DNG', 'IMG_7419.DNG'],
    4: ['2.940gms.DNG', 'IMG_7422.DNG', 'IMG_7423.DNG'],
    5: ['1.770gms.DNG'],
    6: ['2.460gms.DNG'],
    7: ['2.690gms.DNG', 'IMG_7427.DNG', 'IMG_7428.DNG'],
    8: ['1.720gms.DNG'],
    9: ['2.700gms.DNG', 'IMG_7430.DNG', 'IMG_7431.DNG'],
    10: ['IMG_7434.HEIC', '2.150.HEIC'],
    11: ['IMG_7435.HEIC', 'IMG_7436.HEIC'],
    12: ['1.450gms.HEIC'],
    13: ['IMG_7441.HEIC', 'IMG_7440.HEIC'],
    14: ['2.310gms.HEIC'],
    15: ['2.090gms.HEIC'],
    16: ['IMG_7446.HEIC', 'IMG_7445.HEIC', '2.850gms.HEIC'],
    17: ['IMG_7448.HEIC', '2.690gms.HEIC'],
    18: ['2.780gms.HEIC'],
    19: ['IMG_7451.HEIC', '1.870gms.HEIC'],
    20: ['2.020gms.HEIC'],
    21: ['1.720gms.HEIC'],
}


def decode(path: Path) -> Image.Image:
    if path.suffix.upper() == '.DNG':
        import rawpy
        with rawpy.imread(str(path)) as raw:
            return Image.fromarray(raw.postprocess(use_camera_wb=True, output_bps=8))
    import pillow_heif
    pillow_heif.register_heif_opener()
    return ImageOps.exif_transpose(Image.open(path)).convert('RGB')


def ring_box(im: Image.Image, session) -> tuple[int, int, int, int]:
    """Bounding box of the ring in full-resolution pixels."""
    from rembg import remove
    scale = 1024 / max(im.size)
    small = im.resize((round(im.width * scale), round(im.height * scale)))
    alpha = np.asarray(remove(small, session=session).split()[3]) > 100
    ys, xs = np.nonzero(alpha)
    if not len(xs):
        raise RuntimeError('no ring found')
    return tuple(round(v / scale) for v in (xs.min(), ys.min(), xs.max(), ys.max()))


def crop_3x4(im: Image.Image, box) -> Image.Image:
    """A 3:4 crop centred on the ring, the ring about 60% of the width, never smaller than 1500 px wide."""
    x0, y0, x1, y1 = box
    w = max((x1 - x0) / 0.6, (y1 - y0) / 0.6 * 3 / 4, 1500)
    w = min(w, im.width, im.height * 3 / 4)
    h = w * 4 / 3
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    left = min(max(cx - w / 2, 0), im.width - w)
    top = min(max(cy - h / 2, 0), im.height - h)
    return im.crop((round(left), round(top), round(left + w), round(top + h)))


def trim() -> None:
    """Crop each ring cut-out to the ring plus a little air, as the other cut-outs are framed."""
    for path in sorted(PREPARED.glob('PLT-RNG-*.png')):
        im = Image.open(path)
        x0, y0, x1, y1 = im.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
        pad = round(max(x1 - x0, y1 - y0) * 0.05)
        im.crop((max(x0 - pad, 0), max(y0 - pad, 0), min(x1 + pad, im.width), min(y1 + pad, im.height))).save(path, optimize=True)
        print(path.stem, 'trimmed to', Image.open(path).size)


def main() -> None:
    if '--trim' in sys.argv:
        return trim()
    from rembg import new_session
    session = new_session('isnet-general-use')
    OUT.mkdir(parents=True, exist_ok=True)
    for ring, files in RINGS.items():
        for i, name in enumerate(files, start=1):
            stem = f'PLT-RNG-{ring:03d}-{i:02d}'
            im = decode(SRC / name)
            out = crop_3x4(im, ring_box(im, session))
            out.save(OUT / f'{stem}.jpg', quality=92)
            print(f'{stem}\t{name}\t{out.width}x{out.height}', flush=True)


if __name__ == '__main__':
    main()
