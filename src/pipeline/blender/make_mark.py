"""
The hallmark die face, as a height map for the stamp scene: "925" set in a bold serif
inside a hexagonal cartouche, with "BIS" above it, the way a sterling hallmark sits on a
bar. White is raised on the die (so it is cut into the silver). Writes
assets/render/mark.png (2048×1024).
"""
import math
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
W, H = 2048, 1024
im = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(im)
font = None
for f in ("C:/Windows/Fonts/georgiab.ttf", "C:/Windows/Fonts/timesbd.ttf"):
    if os.path.exists(f):
        font = f
        break
big = ImageFont.truetype(font, 250)
small = ImageFont.truetype(font, 175)

# Hexagonal cartouche around the fineness.
cx, cy, rx, ry = W / 2, H / 2 + 60, 430, 250
pts = [(cx + rx * math.cos(a), cy + ry * math.sin(a)) for a in [math.radians(x) for x in (0, 60, 120, 180, 240, 300)]]
d.polygon(pts, outline=255, width=26)
d.text((cx, cy + 4), "925", font=big, fill=255, anchor="mm")
d.text((cx, cy - ry - 135), "BIS", font=small, fill=255, anchor="mm")
im = im.filter(ImageFilter.GaussianBlur(3.5))  # a die face has bevelled edges
os.makedirs(os.path.join(ROOT, "assets", "render"), exist_ok=True)
im.save(os.path.join(ROOT, "assets", "render", "mark.png"))
print("mark written")
