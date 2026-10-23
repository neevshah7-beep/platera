"""
Cuts a ring out of an upright studio photo on polished marble, without the mirror
reflection the marble throws below it. The reflection is joined to the ring where the band
touches the stone; that contact shows as the narrowest row of the mask in the lower part
of the ring, and everything below it is dropped (with a soft edge).
"""
import numpy as np
from PIL import Image, ImageFilter


def drop_reflection(cut: Image.Image) -> Image.Image:
    """The marble mirrors the ring below the point where the band touches it. That contact
    is the narrowest row of the mask in the lower part of the ring, and a reflection is
    clearly dimmer than the metal above it; only when both hold is the part below dropped.
    (A V-band or a heart narrows too, but its lower half is as bright as the rest.)"""
    rgba = np.asarray(cut).astype(np.float32)
    a = rgba[..., 3]
    m = a > 100
    ys, xs = np.nonzero(m)
    if not len(ys):
        return cut
    y0, y1 = ys.min(), ys.max()
    h = y1 - y0 + 1
    lum = rgba[..., :3].mean(-1)
    rows = m[y0:y1 + 1].sum(1).astype(np.float32)
    k = max(3, h // 60)
    sm = np.convolve(rows, np.ones(k) / k, mode='same')
    best = None
    for frac in (0.5, 0.6, 0.7, 0.8):
        lo, hi = int(h * frac) - int(h * 0.1), int(h * frac) + int(h * 0.1)
        lo, hi = max(lo, int(h * 0.4)), min(hi, int(h * 0.96))
        if hi <= lo:
            continue
        c = lo + int(sm[lo:hi].argmin())
        cy = y0 + c
        up = lum[max(y0, cy - h // 5):cy][m[max(y0, cy - h // 5):cy]]
        dn = lum[cy:y1 + 1][m[cy:y1 + 1]]
        if len(up) < 50 or len(dn) < 50:
            continue
        ratio = float(np.median(dn) / max(1.0, np.median(up)))
        if sm[c] < 0.7 * sm.max() and ratio < 0.8 and (best is None or ratio < best[1]):
            best = (cy, ratio)
    if best is None:
        return cut
    cy = best[0]
    band = max(2, h // 90)
    fade = np.ones_like(a)
    fade[cy:] = 0
    fade[cy - band:cy] = np.linspace(1, 0, band)[:, None]
    out = np.asarray(cut).copy()
    out[..., 3] = (out[..., 3] * fade).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def keep_ring(cut: Image.Image) -> Image.Image:
    """Drops stray specks the model kept (dust, sparkles on the marble): only pieces of the
    mask at least 3% the size of the largest survive."""
    from scipy import ndimage
    a = np.asarray(cut).copy()
    m = a[..., 3] > 24
    lab, n = ndimage.label(m)
    if n <= 1:
        return cut
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    big = int(np.argmax(sizes)) + 1
    ys, xs = np.nonzero(lab == big)
    pad_y, pad_x = (ys.max() - ys.min()) * 0.12, (xs.max() - xs.min()) * 0.12
    boxes = ndimage.find_objects(lab)
    near = lambda b: b[0].start <= ys.max() + pad_y and b[0].stop >= ys.min() - pad_y and b[1].start <= xs.max() + pad_x and b[1].stop >= xs.min() - pad_x
    keep = np.isin(lab, [i + 1 for i, v in enumerate(sizes) if v >= 0.03 * sizes.max() and near(boxes[i])])
    a[..., 3] = np.where(keep, a[..., 3], 0)
    return Image.fromarray(a, 'RGBA')


def trim_below(cut: Image.Image, frac: float) -> Image.Image:
    """Removes everything below a fraction of the cut-out's height (a reflection seen by eye)."""
    a = np.asarray(cut).copy()
    y = int(a.shape[0] * frac)
    band = max(2, a.shape[0] // 90)
    a[y:, :, 3] = 0
    a[y - band:y, :, 3] = (a[y - band:y, :, 3] * np.linspace(1, 0, band)[:, None]).astype(np.uint8)
    return Image.fromarray(a, 'RGBA')


def crop_tight(cut: Image.Image) -> Image.Image:
    x0, y0, x1, y1 = cut.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    pad = round(max(x1 - x0, y1 - y0) * 0.05)
    return cut.crop((max(x0 - pad, 0), max(y0 - pad, 0), min(x1 + pad, cut.width), min(y1 + pad, cut.height)))


def cut_ring(im: Image.Image, session) -> Image.Image:
    from rembg import remove
    cut = keep_ring(drop_reflection(remove(im.convert('RGB'), session=session)))
    box = cut.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    x0, y0, x1, y1 = box
    pad = round(max(x1 - x0, y1 - y0) * 0.05)
    return cut.crop((max(x0 - pad, 0), max(y0 - pad, 0), min(x1 + pad, cut.width), min(y1 + pad, cut.height)))
