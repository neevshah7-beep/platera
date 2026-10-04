"""
Interim photo treatment until the reshoot (see SHOOT_GUIDE.md).

Output is a transparent PNG per photo: the piece alone, so it can lie on the
velvet of the site and on the trays of the 3D house without a rectangle around it.

The supplied photos sit on five different backgrounds (royal blue, green felt,
terracotta, black leather, grey). This puts every piece on the same onyx ground
so the catalogue reads as one house:

- Light or coloured backgrounds: the piece is cut out (rembg, isnet-general-use)
  and composited onto onyx.
- Already-dark backgrounds: cut-out models lose fine chain against black, so these
  are tone-mapped instead. Shadows are pulled down to onyx and the metal is left alone.

Input:  assets/sorted/PLT-*.jpg     (originals, renamed)
Output: assets/prepared/PLT-*.png   (2400 px long side, RGBA), plus a report line per file.

Usage:  python scripts/prepare-photos.py [--only PLT-NKS-001-01 ...]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ONYX = (14, 13, 12)  # --onyx #0E0D0C
LONG_SIDE = 2400
SRC = Path('assets/sorted')
OUT = Path('assets/prepared')


def border_luminance(im: Image.Image) -> float:
    """Median luminance of a 4% frame around the edge: a fair read of the background."""
    g = np.asarray(im.convert('L'), dtype=np.float32)
    h, w = g.shape
    b = max(4, int(min(h, w) * 0.04))
    frame = np.concatenate([g[:b].ravel(), g[-b:].ravel(), g[:, :b].ravel(), g[:, -b:].ravel()])
    return float(np.median(frame))


def border_colour(im: Image.Image) -> tuple[np.ndarray, float]:
    """Median RGB of the border frame (0-1) and its saturation."""
    a = np.asarray(im, dtype=np.float32) / 255.0
    h, w, _ = a.shape
    b = max(4, int(min(h, w) * 0.04))
    frame = np.concatenate([a[:b].reshape(-1, 3), a[-b:].reshape(-1, 3), a[:, :b].reshape(-1, 3), a[:, -b:].reshape(-1, 3)])
    med = np.median(frame, axis=0)
    sat = float(med.max() - med.min())
    return med, sat


def colour_distance_mask(im: Image.Image, bg: np.ndarray) -> Image.Image:
    """
    Pixels far from the background colour are jewellery. On saturated backgrounds this
    catches fine chain and pale strands the segmentation model drops. Distance is
    measured on chroma and lightness separately so blue reflections on silver still count
    as metal (they are much lighter than the background).
    """
    a = np.asarray(im, dtype=np.float32) / 255.0
    chroma = np.linalg.norm((a - a.mean(axis=2, keepdims=True)) - (bg - bg.mean()), axis=2)
    light = np.abs(a.mean(axis=2) - bg.mean())
    d = np.maximum(chroma * 1.6, light * 1.2)
    m = np.clip((d - 0.22) / 0.14, 0, 1)
    mask = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
    return mask


def tone_to_onyx(im: Image.Image) -> Image.Image:
    """Pull a dark background down to onyx without touching the highlights on metal."""
    a = np.asarray(im, dtype=np.float32) / 255.0
    lum = a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    # Weight is 1 in deep shadow, falling to 0 by mid-grey, so bright metal is untouched.
    w = np.clip((0.42 - lum) / 0.30, 0.0, 1.0)[..., None]
    onyx = np.array(ONYX, dtype=np.float32) / 255.0
    out = a * (1 - w) + onyx * w
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))


def cut_out(im: Image.Image, session, bg: np.ndarray, bg_lum: float, bg_sat: float) -> Image.Image:
    """
    The piece on a transparent ground.

    The segmentation model (rembg) finds the piece well on coloured backgrounds but
    drops fine chain and pale strands. We add back only what is *near* what it found:
    pixels that differ clearly from the background colour within ~30 px of the model's
    mask. Far from the piece, a gradient in the backdrop can never be mistaken for metal.
    On neutral dark backgrounds (black leather, grey card), where the model struggles,
    bright metal is keyed by brightness instead.
    """
    from rembg import remove

    model = np.asarray(remove(im, session=session).split()[3]).astype(np.float32) / 255
    near = np.asarray(Image.fromarray((model > 0.4).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(31))) > 0

    if bg_lum < 70 and bg_sat < 0.12:
        lum = np.asarray(im.convert('L')).astype(np.float32)
        key = np.clip((lum - (bg_lum + 22)) / 40, 0, 1)
        extra = key
    else:
        extra = np.asarray(colour_distance_mask(im, bg)).astype(np.float32) / 255 * near

    alpha = np.maximum(model, extra)
    alpha_img = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    out = im.convert('RGBA')
    out.putalpha(alpha_img)
    return out


def main() -> None:
    only = set(sys.argv[sys.argv.index('--only') + 1:]) if '--only' in sys.argv else None
    OUT.mkdir(parents=True, exist_ok=True)
    session = None
    for path in sorted(SRC.glob('PLT-*.jpg')):
        if only and path.stem not in only:
            continue
        im = Image.open(path).convert('RGB')
        im.thumbnail((LONG_SIDE, LONG_SIDE), Image.LANCZOS)
        colour, sat = border_colour(im)
        if session is None:
            from rembg import new_session
            session = new_session('isnet-general-use')
        result = cut_out(im, session, colour, border_luminance(im), sat)
        out = OUT / f'{path.stem}.png'
        result.save(out, optimize=True)
        print(f'{path.stem}	cutout	bg-sat={sat:.2f}	{result.width}x{result.height}')


if __name__ == '__main__':
    main()
