"""Compare background-removal models on the worst ring photos: raw | birefnet-general | bria-rmbg."""
import os, sys
sys.path.insert(0, 'scripts')
from PIL import Image, ImageDraw
from rembg import remove, new_session
from oct23_rings import RINGS, FOLDERS

TEST = sys.argv[1:] or ['PLT-RNG-005', 'PLT-RNG-010', 'PLT-RNG-021', 'PLT-RNG-024', 'PLT-RNG-002', 'PLT-RNG-007']
files = {k: sorted(os.listdir(f'assets/raw/oct23/{v}')) for k, v in FOLDERS.items()}
models = ['birefnet-general', 'bria-rmbg']
sessions = {m: new_session(m, providers=['CPUExecutionProvider']) for m in models}
os.makedirs('look/oct23/models', exist_ok=True)
for sku in TEST:
    k, i = RINGS[sku][0]
    im = Image.open(f'assets/raw/oct23/{FOLDERS[k]}/{files[k][i]}').convert('RGB')
    cols = [im]
    for m in models:
        out = remove(im, session=sessions[m])
        out.save(f'look/oct23/models/{sku}-{m}.png')
        bg = Image.new('RGBA', out.size, (246, 239, 224, 255)); bg.alpha_composite(out)
        cols.append(bg.convert('RGB'))
    W = 460; H = int(im.height * W / im.width)
    sheet = Image.new('RGB', (W * 3, H), 'white')
    for c, x in enumerate(cols): sheet.paste(x.resize((W, H)), (c * W, 0))
    sheet.save(f'look/oct23/models/{sku}.jpg', quality=85)
    print(sku, 'done', flush=True)
