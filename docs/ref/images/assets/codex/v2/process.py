"""Codex 생성 원본(v2, 장면 S02~S08) → public/images/s0X (여백 자르기 · 크기 맞추기).
저장소 루트에서 실행: python3 docs/ref/images/assets/codex/v2/process.py
"""
from PIL import Image
import os
D = 'docs/ref/images/assets/codex/v2/'
O = 'public/images/'

def trim(im):
    a = im.getchannel('A').point(lambda v: 255 if v > 12 else 0)
    return im.crop(a.getbbox())

def cutout(src, dst, width=None, height=None):
    im = trim(Image.open(D + src).convert('RGBA'))
    if width: im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    if height: im = im.resize((round(im.width * height / im.height), height), Image.LANCZOS)
    os.makedirs(os.path.dirname(O + dst), exist_ok=True)
    im.save(O + dst, optimize=True)
    print(dst, im.size)

def photo(src, dst):
    im = Image.open(D + src).convert('RGB')
    im = im.resize((1920, round(im.height * 1920 / im.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(O + dst), exist_ok=True)
    im.save(O + dst, quality=80, optimize=True, progressive=True)
    print(dst, im.size)

# S02 구호 물품 · 상자
cutout('rutf.png', 's02/rutf.png', width=640)
cutout('bandage.png', 's02/bandage.png', width=300)
cutout('vaccine.png', 's02/vaccine.png', height=520)
cutout('syringe.png', 's02/syringe.png', width=720)
cutout('crate_front.png', 's02/crate_front.png', width=1100)
pills = Image.open(D + 'pill.png').convert('RGBA')
c = pills.width // 3
for i in range(9):
    x, y = (i % 3) * c, (i // 3) * c
    p = trim(pills.crop((x, y, x + c, y + c)))
    p.thumbnail((110, 110), Image.LANCZOS)
    p.save('%ss02/pill_%d.png' % (O, i + 1), optimize=True)
print('s02/pill_1..9.png')
# S03 전장 · 병원
photo('war_bg.png', 's03/war_bg.jpg')
cutout('hospital.png', 's03/hospital.png', width=1200)
cutout('hospital_lit.png', 's03/hospital_lit.png', width=1200)
cutout('paper.png', 's03/paper.png', width=1100)
# S04 세계 지도
cutout('world_dots.png', 's04/world_dots.png', width=1600)
# S05 도시 지도
photo('city_map.png', 's05/city_map.jpg')
# S06 쿤두즈 외상센터
for s in ('normal', 'burning', 'ruins'):
    im = Image.open(D + 'building_%s.png' % s).convert('RGBA')
    im = im.resize((1500, round(im.height * 1500 / im.width)), Image.LANCZOS)   # 세 장 같은 틀 유지 (자르지 않음)
    os.makedirs(O + 's06', exist_ok=True)
    im.save(O + 's06/building_%s.png' % s, optimize=True)
print('s06/building_*.png')
cutout('plane.png', 's06/plane.png', width=420)
# S08 밤 지도
photo('night_map.png', 's08/night_map.jpg')
