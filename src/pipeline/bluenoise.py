"""
Blue-noise texture by Ulichney's void-and-cluster method (toroidal, so it tiles).
Used by the film grain (Experience Bible §2.10) and the volumetric ray-march dithering
(§4): blue noise has no low-frequency energy, so grain reads as fine silver halide and
dithering disappears instead of crawling.

Writes public/textures/bluenoise128.png (8-bit grey, rank-ordered thresholds).
Run:  python src/pipeline/bluenoise.py
"""
import os

import numpy as np
from PIL import Image

N = 128
SIGMA = 1.9
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Toroidal Gaussian kernel, centred at (0, 0).
d = np.minimum(np.arange(N), N - np.arange(N))
K = np.exp(-(d[:, None] ** 2 + d[None, :] ** 2) / (2 * SIGMA ** 2))
FK = np.fft.fft2(K)


def energy(binary: np.ndarray) -> np.ndarray:
    return np.real(np.fft.ifft2(np.fft.fft2(binary.astype(np.float64)) * FK))


def kernel_at(y: int, x: int) -> np.ndarray:
    return np.roll(np.roll(K, y, 0), x, 1)


rng = np.random.default_rng(7)
ones = int(N * N * 0.1)
pattern = np.zeros((N, N), bool)
pattern.flat[rng.choice(N * N, ones, replace=False)] = True

# 1. Relax the initial pattern: move the tightest cluster into the largest void until stable.
E = energy(pattern)
while True:
    e = np.where(pattern, E, -np.inf)
    cy, cx = np.unravel_index(np.argmax(e), e.shape)
    pattern[cy, cx] = False
    E -= kernel_at(cy, cx)
    e = np.where(~pattern, E, np.inf)
    vy, vx = np.unravel_index(np.argmin(e), e.shape)
    if (vy, vx) == (cy, cx):
        pattern[cy, cx] = True
        E += kernel_at(cy, cx)
        break
    pattern[vy, vx] = True
    E += kernel_at(vy, vx)

rank = np.zeros((N, N), np.int64)
initial = pattern.copy()

# 2. Ranks below the initial count: remove the tightest clusters one by one.
p = initial.copy()
E = energy(p)
for r in range(ones - 1, -1, -1):
    e = np.where(p, E, -np.inf)
    y, x = np.unravel_index(np.argmax(e), e.shape)
    p[y, x] = False
    E -= kernel_at(y, x)
    rank[y, x] = r

# 3. Ranks above: fill the largest voids one by one.
p = initial.copy()
E = energy(p)
for r in range(ones, N * N):
    e = np.where(~p, E, np.inf)
    y, x = np.unravel_index(np.argmin(e), e.shape)
    p[y, x] = True
    E += kernel_at(y, x)
    rank[y, x] = r

img = (rank * 256 // (N * N)).astype(np.uint8)
out = os.path.join(ROOT, 'public', 'textures', 'bluenoise128.png')
Image.fromarray(img, 'L').save(out)
print('wrote', out)
