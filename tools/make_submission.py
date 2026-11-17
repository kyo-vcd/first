#!/usr/bin/env python3
"""과제 제출용 폴더 만들기

public/ 을 복사해 '학번_이름' 폴더와 zip 을 만든다.

사용법 (저장소 어디서든):
    python3 tools/make_submission.py 학번_이름
    예) python3 tools/make_submission.py 20251234_홍길동

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


def fail(msg):
    print("오류: " + msg)
    sys.exit(1)


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)

    name = sys.argv[1].strip()
    if not name or re.search(r'[\\/:*?"<>|]', name):
        fail("폴더 이름에 쓸 수 없는 문자가 있습니다.")
    if not re.match(r"^\d+_.+$", name):
        print("주의: 폴더 이름이 '학번_이름' 형식이 아닙니다. 그대로 진행합니다.")

    out = DIST / name
    if out.exists():
        shutil.rmtree(out)
    DIST.mkdir(exist_ok=True)

    shutil.copytree(PUBLIC, out, ignore=shutil.ignore_patterns(".DS_Store"))
    (out / "img").mkdir(exist_ok=True)

    zip_path = shutil.make_archive(str(DIST / name), "zip", root_dir=DIST, base_dir=name)

    print("완료")
    print("  폴더: " + str(out))
    print("  압축: " + zip_path)
    for p in sorted(out.iterdir()):
        print("    " + p.name + ("/" if p.is_dir() else ""))


if __name__ == "__main__":
    main()
