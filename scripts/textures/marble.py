"""
White Carrara-style marble texture for the 3D house (public/textures/marble_white.jpg).
Classic method: fractal noise (several octaves of smooth random fields) warps a sine
pattern; the thin, sharp ridges of |sin| become the veins. Seeded, so it's reproducible.
"""
import numpy as np
from PIL import Image, ImageFilter

N = 2048
rng = np.random.default_rng(925)

def smooth_noise(cells):
    small = rng.random((cells, cells)).astype(np.float32)
    img = Image.fromarray((small * 255).astype(np.uint8)).resize((N, N), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 255.0

def fbm(octaves=6, base=4):
    total = np.zeros((N, N), np.float32); amp = 1.0; norm = 0.0
    for o in range(octaves):
        total += amp * smooth_noise(base * 2 ** o); norm += amp; amp *= 0.5
    return total / norm

y, x = np.mgrid[0:N, 0:N].astype(np.float32) / N
warp = fbm(6, 3)
warp2 = fbm(5, 6)
# Main veins run diagonally; a second, finer set crosses them faintly.
v1 = np.abs(np.sin((x * 3.0 + y * 1.4 + warp * 4.2) * np.pi))
v2 = np.abs(np.sin((x * 1.1 - y * 4.0 + warp2 * 6.0) * np.pi))
veins = np.clip(1 - v1, 0, 1) ** 7 * 0.7 + np.clip(1 - v2, 0, 1) ** 30 * 0.12
cloud = fbm(5, 5)
base = np.array([0.935, 0.925, 0.905])        # warm white stone
vein_col = np.array([0.50, 0.49, 0.47])       # soft grey vein
shade = 1 - (cloud - 0.5) * 0.06                 # faint cloudiness
img = base[None, None, :] * shade[..., None]
img = img * (1 - veins[..., None]) + vein_col[None, None, :] * veins[..., None]
out = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.4))
out.save('public/textures/marble_white.jpg', quality=88)
out.resize((512, 512)).save('public/textures/marble_white_preview.jpg', quality=80)
print('ok', out.size)
