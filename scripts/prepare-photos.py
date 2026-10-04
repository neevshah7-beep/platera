"""
Interim photo treatment until the reshoot (see SHOOT_GUIDE.md).

The supplied photos sit on five different backgrounds (royal blue, green felt,
terracotta, black leather, grey). This puts every piece on the same onyx ground
so the catalogue reads as one house:

- Light or coloured backgrounds: the piece is cut out (rembg, isnet-general-use)
  and composited onto onyx.
- Already-dark backgrounds: cut-out models lose fine chain against black, so these
  are tone-mapped instead. Shadows are pulled down to onyx and the metal is left alone.

Input:  assets/sorted/PLT-*.jpg     (originals, renamed)
Output: assets/prepared/PLT-*.jpg   (2400 px long side, q92), plus a report line per file.

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
    m = np.clip((d - 0.16) / 0.12, 0, 1)
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


def cut_to_onyx(im: Image.Image, session, bg: np.ndarray, saturated: bool) -> Image.Image:
    from rembg import remove

    cut = remove(im, session=session)
    alpha = cut.split()[3]
    if saturated:
        union = np.maximum(np.asarray(alpha), np.asarray(colour_distance_mask(im, bg)))
        alpha = Image.fromarray(union)
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
    ground = Image.new('RGB', im.size, ONYX)
    ground.paste(cut.convert('RGB'), mask=alpha)
    return ground


def main() -> None:
    only = set(sys.argv[sys.argv.index('--only') + 1:]) if '--only' in sys.argv else None
    OUT.mkdir(parents=True, exist_ok=True)
    session = None
    for path in sorted(SRC.glob('PLT-*.jpg')):
        if only and path.stem not in only:
            continue
        im = Image.open(path).convert('RGB')
        im.thumbnail((LONG_SIDE, LONG_SIDE), Image.LANCZOS)
        bg = border_luminance(im)
        colour, sat = border_colour(im)
        saturated = sat > 0.12
        if bg < 70 and not saturated:
            result, method = tone_to_onyx(im), 'tone'
        else:
            if session is None:
                from rembg import new_session
                session = new_session('isnet-general-use')
            result, method = cut_to_onyx(im, session, colour, saturated), 'cutout+colour' if saturated else 'cutout'
        result.save(OUT / path.name, quality=92, optimize=True)
        print(f'{path.stem}\t{method}\tbg={bg:.0f}\tsat={sat:.2f}\t{result.width}x{result.height}')


if __name__ == '__main__':
    main()
