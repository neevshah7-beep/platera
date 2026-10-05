"""
Textures for the gift scene, drawn with PIL:
  · assets/render/paper.png — espresso wrapping paper with a fine gold-foil pattern: a
    diagonal lattice of tiny diamonds with a small "P" monogram at alternate crossings.
    (The foil is a separate mask so Blender can make it metallic.)
  · assets/render/paper_foil.png — that foil mask (white = gold).
  · assets/render/tag.png — the cream gift tag, "For you" set in a serif, gold.
"""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT = os.path.join(ROOT, "assets", "render")
os.makedirs(OUT, exist_ok=True)
font = next((f for f in ("C:/Windows/Fonts/georgia.ttf", "C:/Windows/Fonts/times.ttf") if os.path.exists(f)))
fontb = next((f for f in ("C:/Windows/Fonts/georgiab.ttf", "C:/Windows/Fonts/timesbd.ttf") if os.path.exists(f)))

S = 2048
mask = Image.new("L", (S, S), 0)
d = ImageDraw.Draw(mask)
step = 128
mono = ImageFont.truetype(fontb, 46)
for gy in range(-step, S + step, step):
    for gx in range(-step, S + step, step):
        # Fine diagonal lattice lines.
        d.line([(gx, gy), (gx + step, gy + step)], fill=170, width=2)
        d.line([(gx + step, gy), (gx, gy + step)], fill=170, width=2)
        cx, cy = gx + step / 2, gy + step / 2
        if ((gx // step) + (gy // step)) % 2 == 0:
            d.text((cx, cy), "P", font=mono, fill=255, anchor="mm")
        else:
            r = 7
            d.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(0.8))
mask.save(os.path.join(OUT, "paper_foil.png"))

base = Image.new("RGB", (S, S), (43, 27, 15))
# A faint fibre texture in the paper.
noise = Image.effect_noise((S, S), 18).filter(ImageFilter.GaussianBlur(1.2))
base = Image.blend(base, Image.merge("RGB", (noise, noise, noise)).point(lambda v: int(v * 0.25 + 30)), 0.12)
gold = Image.new("RGB", (S, S), (201, 154, 62))
paper = Image.composite(gold, base, mask)
paper.save(os.path.join(OUT, "paper.png"))

tag = Image.new("RGB", (1200, 700), (247, 239, 224))
t = ImageDraw.Draw(tag)
t.rectangle([24, 24, 1176, 676], outline=(185, 138, 62), width=4)
t.text((600, 300), "For you", font=ImageFont.truetype(font, 190), fill=(150, 110, 46), anchor="mm")
t.text((600, 500), "P L A T E R A", font=ImageFont.truetype(font, 60), fill=(150, 110, 46), anchor="mm")
tag.save(os.path.join(OUT, "tag.png"))
print("textures written")
