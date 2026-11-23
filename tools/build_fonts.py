#!/usr/bin/env python3
"""Noto Sans KR 글꼴을 사이트에 포함하기 (오프라인에서도 같은 글꼴)

public/ 의 HTML · CSS · JS 에 나오는 글자만 남긴 woff2 를 굵기별로 만든다.
문구를 바꾸거나 장면을 추가하면 다시 실행한다.

    pip install fonttools brotli
    python3 tools/build_fonts.py

결과: public/fonts/noto_sans_kr_{400,500,700,800,900}.woff2, public/fonts/OFL.txt
원본은 Google Fonts 에서 내려받는다 (SIL Open Font License 1.1, 재배포 가능).
"""

import io
import re
import string
import sys
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
OUT = PUBLIC / "fonts"
WEIGHTS = [400, 500, 700, 800, 900]
CSS_API = "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@{}"
OFL = "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/LICENSE"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "font-build"})
    with urllib.request.urlopen(req) as r:
        return r.read()


def page_text():
    chars = set(string.printable)
    chars |= set("·—–…“”‘’※→←↓↑₩%")
    for f in PUBLIC.rglob("*"):
        if f.suffix in {".html", ".css", ".js"}:
            chars |= set(f.read_text(encoding="utf-8"))
    return "".join(sorted(c for c in chars if not c.isspace() or c == " "))


def main():
    text = page_text()
    korean = sum(1 for c in text if "가" <= c <= "힣")
    print("글자 수: %d (한글 %d)" % (len(text), korean))
    OUT.mkdir(exist_ok=True)
    for w in WEIGHTS:
        css = fetch(CSS_API.format(w)).decode()
        m = re.search(r"url\((https://[^)]+\.ttf)\)", css)
        if not m:
            sys.exit("글꼴 주소를 찾지 못했습니다: %d" % w)
        font = TTFont(io.BytesIO(fetch(m.group(1))))
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        opts.notdef_outline = True
        sub = subset.Subsetter(opts)
        sub.populate(text=text)
        sub.subset(font)
        path = OUT / ("noto_sans_kr_%d.woff2" % w)
        font.flavor = "woff2"
        font.save(path)
        print("  %s  %d KB" % (path.relative_to(ROOT), path.stat().st_size // 1024))
    try:
        (OUT / "OFL.txt").write_bytes(fetch(OFL))
    except Exception as e:  # 라이선스 파일은 이미 있으면 그대로 둔다
        if not (OUT / "OFL.txt").exists():
            print("주의: 라이선스 파일을 받지 못했습니다:", e)


if __name__ == "__main__":
    main()
