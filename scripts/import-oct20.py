"""
Brings the October 2026 pendant and ring folders (iPhone ProRAW DNG and HEIC) into the
photo pipeline, framed the same way as the ring shoot (scripts/import-rings.py): each
photo is cropped to 3:4 around the piece with its background kept, and saved as

  assets/raw/oct20/<folder>/<file>  ->  assets/sorted/PLT-{PND|RNG}-{nnn}-{nn}.jpg

Pieces and their photos (best view first):
  PLT-PND-001 Nataraja             PLT-PND-006 Elephant
  PLT-PND-002 Trishul and damru    PLT-PND-007 Fish
  PLT-PND-003 Tiger claw           PLT-PND-008 Hanuman gada
  PLT-PND-004 Small trishul        PLT-PND-009 Cricket bat
  PLT-PND-005 Shri Ram (2 photos)  PLT-PND-010 Rudraksha
  PLT-RNG-022 white halo ring, 3.420 g   PLT-RNG-023 red halo ring, 3.650 g

Then, in order:
  python scripts/prepare-photos.py --only <the -01 of each>
  python scripts/import-oct20.py --trim
  npm run images && python src/pipeline/make-maps.py && node scripts/encode-originals.mjs

Usage: python scripts/import-oct20.py [--trim]
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from importlib import import_module

rings = import_module('import-rings')

SRC = Path('assets/raw/oct20')
OUT = Path('assets/sorted')
PREPARED = Path('assets/prepared')

# (sku, [(file, rotate degrees)])
PIECES = [
    ('PLT-PND-001', [('Pendant/IMG_7346.DNG', 0)]),
    ('PLT-PND-002', [('Pendant/IMG_7349.DNG', 0)]),
    ('PLT-PND-003', [('Pendant/IMG_7350.DNG', 0)]),
    ('PLT-PND-004', [('Pendant/IMG_7352.DNG', 0)]),
    ('PLT-PND-005', [('Pendant/IMG_7354.DNG', 0), ('Pendant/IMG_7353.DNG', 180)]),
    ('PLT-PND-006', [('Pendant/IMG_7355.DNG', 0)]),
    ('PLT-PND-007', [('Pendant/IMG_7356.DNG', 0)]),
    ('PLT-PND-008', [('Pendant/IMG_7357.DNG', 0)]),
    ('PLT-PND-009', [('Pendant/IMG_7358.DNG', 0)]),
    ('PLT-PND-010', [('Pendant/IMG_7359.DNG', 0)]),
    ('PLT-RNG-022', [('Rings/Ring diamond weight 3.420', 0), ('Rings/IMG_7203.HEIC', 0), ('Rings/IMG_7205.HEIC', 0)]),
    ('PLT-RNG-023', [('Ring 2/Weight 3.650gms', 0), ('Ring 2/IMG_7209.HEIC', 0), ('Ring 2/IMG_7210.HEIC', 0)]),
]


def decode(path: Path) -> Image.Image:
    # The two weight-named files are HEIC without an extension.
    if path.suffix == '':
        import pillow_heif
        from PIL import ImageOps
        pillow_heif.register_heif_opener()
        return ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    return rings.decode(path)


def trim() -> None:
    """Crop each new cut-out to the piece plus a little air, as the other cut-outs are framed."""
    for sku, _ in PIECES:
        path = PREPARED / f'{sku}-01.png'
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
    for sku, files in PIECES:
        for i, (name, turn) in enumerate(files, start=1):
            stem = f'{sku}-{i:02d}'
            im = decode(SRC / name)
            if turn:
                im = im.rotate(turn, expand=True)
            out = rings.crop_3x4(im, rings.ring_box(im, session))
            out.save(OUT / f'{stem}.jpg', quality=92)
            print(f'{stem}\t{name}\t{out.width}x{out.height}', flush=True)


if __name__ == '__main__':
    main()
