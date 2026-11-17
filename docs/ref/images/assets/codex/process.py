"""Codex 생성 원본 → public/img (시안 색에 맞춤, 동전 4종씩 잘라 160px, 바닥은 이음매 없이).
저장소 루트에서 실행: python3 docs/ref/images/assets/codex/process.py
"""
from PIL import Image, ImageOps
import numpy as np

G = 'docs/ref/images/assets/codex/'   # Codex 생성 원본
O = 'public/img/'
A = 'docs/ref/images/assets/'


def match(arr, src_mean, dst_mean, mask):
    """Per-channel linear gain so the masked mean moves from src_mean to dst_mean."""
    out = arr.astype(np.float32)
    for c in range(3):
        out[..., c] *= dst_mean[c] / src_mean[c]
    return np.clip(out, 0, 255)


def masked_mean(rgb, mask):
    return [float(rgb[..., c][mask].mean()) for c in range(3)]


# ---- coins: 2x2 sheets -> 4 coins each, color matched to mockup coin mean (160,119,52)
MOCK_COIN = (160, 119, 52)
gold = np.array(Image.open(G + 'coin-gold.png').convert('RGBA'))
gm = (gold[..., 3] > 200) & (gold[..., 0] > 90) & (gold[..., 0] > gold[..., 2] + 30)
gain_src = masked_mean(gold[..., :3], gm)
print('gold mean before', [round(x) for x in gain_src])

for name in ('coin-gold', 'coin-blood'):
    im = np.array(Image.open(G + '' + name + '.png').convert('RGBA'))
    rgb = match(im[..., :3], gain_src, MOCK_COIN, None)
    im = np.dstack([rgb.astype(np.uint8), im[..., 3]])
    sheet = Image.fromarray(im, 'RGBA')
    h = sheet.width // 2
    for i, (cx, cy) in enumerate(((0, 0), (h, 0), (0, h), (h, h))):
        if name == 'coin-blood' and i not in (0, 3):
            continue   # 핏자국 금화는 1·4번만 쓴다 (s01.js COIN_SRC)
        c = sheet.crop((cx, cy, cx + h, cy + h))
        a = c.getchannel('A').point(lambda v: 255 if v > 24 else 0)
        c = c.crop(a.getbbox())
        s = max(c.size)
        sq = Image.new('RGBA', (s, s))
        sq.paste(c, ((s - c.width) // 2, (s - c.height) // 2))
        sq.resize((160, 160), Image.LANCZOS).save('%ss01/%s-%d.png' % (O, name, i + 1), optimize=True)

# ---- background: match mockup empty-area mean (21,17,16)
bg = np.array(Image.open(G + 'bg.png').convert('RGB'))
center = np.zeros(bg.shape[:2], bool)
center[300:800, 1300:1500] = True
bg = match(bg, masked_mean(bg, center), (21, 17, 16), None).astype(np.uint8)
Image.fromarray(bg).save(O + 'bg.jpg', quality=82, optimize=True, progressive=True)

# ---- floor: keep painted strip, match mockup floor mean (83,26,21) with offset for G/B, seamless tile
f = np.array(Image.open(G + 'floor.png').convert('RGBA')).astype(np.float32)
alpha = f[..., 3]
rows = np.where(alpha.mean(axis=1) > 8)[0]
top = max(0, rows.min() - 10)
f = f[top:]
solid = f[..., 3] > 240
mean = [float(f[..., c][solid].mean()) for c in range(3)]
target = (83, 26, 21)
f[..., 0] *= target[0] / mean[0]
f[..., 1] += target[1] - mean[1]
f[..., 2] += target[2] - mean[2]
f[..., :3] = np.clip(f[..., :3], 0, 255)
fl = Image.fromarray(f.astype(np.uint8), 'RGBA')
W, H = fl.size
o = 240
out = fl.crop((0, 0, W - o, H)).copy()
mask = ImageOps.invert(Image.linear_gradient('L').rotate(90, expand=True)).resize((o, H))
out.paste(Image.composite(fl.crop((W - o, 0, W, H)), fl.crop((0, 0, o, H)), mask), (0, 0))
out = out.resize((out.width * 200 // H, 200), Image.LANCZOS)
out.save(O + 'floor.png', optimize=True)
print('floor strip', (W, H), '->', out.size)

# ---- post: sharpen coins (speckle survives downscaling), boost floor grain contrast
from PIL import ImageFilter, ImageEnhance
import glob
for p in glob.glob(O + 's01/coin-*.png'):
    im = Image.open(p).convert('RGBA')
    a = im.getchannel('A')
    rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.2, percent=140, threshold=1))
    rgb = ImageEnhance.Contrast(rgb).enhance(1.15)
    out = rgb.convert('RGBA'); out.putalpha(a); out.save(p, optimize=True)
fl = np.array(Image.open(O + 'floor.png').convert('RGBA')).astype(np.float32)
solid = fl[..., 3] > 200
for c in range(3):
    m = fl[..., c][solid].mean()
    fl[..., c] = np.where(solid, m + (fl[..., c] - m) * 2.0, fl[..., c])
fl[..., :3] = np.clip(fl[..., :3], 0, 255)
Image.fromarray(fl.astype(np.uint8), 'RGBA').save(O + 'floor.png', optimize=True)
print('post done')
