#!/usr/bin/env python3
"""과제 제출용 폴더 만들기

public/ 을 복사해 '학번_이름' 폴더를 만들고, 구성 비교 영역을 빼고 고른 구성으로 고정한다.

사용법 (저장소 어디서든):
    python3 tools/make_submission.py 학번_이름 구성번호
    예) python3 tools/make_submission.py 20251234_홍길동 2

    구성번호: 0 현재 / 1 개선1 / 2 개선2  (docs/compare.md)

결과:
    dist/학번_이름/       index.html, css/, js/, img/  (그대로 브라우저에서 열림)
    dist/학번_이름.zip    구글 드라이브 업로드용

배포(Cloudflare Pages)와 저장소의 public/ 은 바꾸지 않는다. dist/ 는 git 에 올리지 않는다.
"""

import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
DIST = ROOT / "dist"
TEXT_EXT = {".html", ".css", ".js"}


def fail(msg):
    print("오류: " + msg)
    sys.exit(1)


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)

    name, variant = sys.argv[1].strip(), sys.argv[2].strip()
    if variant not in ("0", "1", "2"):
        fail("구성번호는 0, 1, 2 중 하나입니다.")
    if not name or re.search(r'[\\/:*?"<>|]', name):
        fail("폴더 이름에 쓸 수 없는 문자가 있습니다.")
    if not re.match(r"^\d+_.+$", name):
        print("주의: 폴더 이름이 '학번_이름' 형식이 아닙니다. 그대로 진행합니다.")

    out = DIST / name
    if out.exists():
        shutil.rmtree(out)
    DIST.mkdir(exist_ok=True)

    # 1) public/ 복사 (구성 비교 스크립트는 제외)
    shutil.copytree(PUBLIC, out, ignore=shutil.ignore_patterns("compare.js", ".DS_Store"))

    # 2) 이미지 폴더 이름을 제출 형식(img)에 맞춘다
    images = out / "images"
    img = out / "img"
    if images.exists() and not img.exists():
        images.rename(img)
        for f in out.rglob("*"):
            if f.suffix in TEXT_EXT:
                t = f.read_text(encoding="utf-8")
                t2 = re.sub(r"(['\"(/])images/", r"\1img/", t)
                if t2 != t:
                    f.write_text(t2, encoding="utf-8")
    img.mkdir(exist_ok=True)

    # 3) index.html: 비교 영역을 빼고 구성을 고정
    index = out / "index.html"
    html = index.read_text(encoding="utf-8")
    html, removed = re.subn(r"[ \t]*<!-- compare:start.*?<!-- compare:end -->[ \t]*\n?", "", html, flags=re.S)
    if removed == 0:
        print("주의: index.html 에서 compare:start ~ compare:end 블록을 찾지 못했습니다.")
    html, n = re.subn(r"<html([^>]*?)\s*data-variant=\"\d\"", r"<html\1", html)
    html = html.replace('<html lang="ko">', '<html lang="ko" data-variant="%s">' % variant, 1)
    if 'data-variant="%s"' % variant not in html:
        fail("index.html 의 <html lang=\"ko\"> 를 찾지 못했습니다.")
    index.write_text(html, encoding="utf-8")

    # 4) zip
    zip_path = shutil.make_archive(str(DIST / name), "zip", root_dir=DIST, base_dir=name)

    labels = {"0": "현재", "1": "개선1", "2": "개선2"}
    print("완료: 구성 %s (%s)" % (variant, labels[variant]))
    print("  폴더: " + str(out))
    print("  압축: " + zip_path)
    for p in sorted(out.iterdir()):
        print("    " + p.name + ("/" if p.is_dir() else ""))


if __name__ == "__main__":
    main()
