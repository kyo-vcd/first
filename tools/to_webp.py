#!/usr/bin/env python3
"""큰 PNG 이미지를 WebP로 바꿔 용량 줄이기 (투명 배경 유지)

    python3 tools/to_webp.py                 # public/images 의 120KB 넘는 PNG 전부
    python3 tools/to_webp.py public/images/s02/crate_front.png ...

바꾼 뒤 PNG 는 지우고, public/ 안의 HTML · CSS · JS 에서 파일 이름을 .webp 로 고친다.
이미지 가공 스크립트(docs/ref/images/assets/codex/**/process.py)를 다시 돌린 뒤에도 실행한다.
"""
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
LIMIT = 120 * 1024


def main():
    files = [Path(a) for a in sys.argv[1:]] or [p for p in (PUBLIC / "images").rglob("*.png") if p.stat().st_size > LIMIT]
    renamed = {}
    for png in files:
        png = png.resolve()
        webp = png.with_suffix(".webp")
        im = Image.open(png)
        im.save(webp, "WEBP", quality=84, alpha_quality=90, method=6)
        print("%-44s %5d KB -> %4d KB" % (png.relative_to(ROOT), png.stat().st_size // 1024, webp.stat().st_size // 1024))
        renamed[png.relative_to(PUBLIC).as_posix()] = webp.relative_to(PUBLIC).as_posix()
        png.unlink()
    for f in PUBLIC.rglob("*"):
        if f.suffix not in {".html", ".css", ".js"}:
            continue
        t = f.read_text(encoding="utf-8")
        t2 = t
        for old, new in renamed.items():
            name_old, name_new = old.split("/", 1)[1], new.split("/", 1)[1]   # images/ 뒤 경로
            t2 = t2.replace(name_old, name_new)
        if t2 != t:
            f.write_text(t2, encoding="utf-8")
            print("  경로 수정:", f.relative_to(ROOT))


if __name__ == "__main__":
    main()
