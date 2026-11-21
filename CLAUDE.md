# CLAUDE.md

학교 수업(INTERACTIVE DESIGN) 과제 프로젝트다. README는 수업용 소개만 둔다.
장면 구현 규칙은 [docs/scene-guide.md](docs/scene-guide.md), 배포는 [docs/deploy.md](docs/deploy.md), 제출은 [docs/assignment.md](docs/assignment.md)를 따른다.
도구: `tools/make_submission.py`(제출 zip), `tools/build_fonts.py`(문구 변경 후 글꼴), `tools/codex_image.sh`(이미지).

- 사이트 파일은 `public/`에만 둔다. 빌드 단계 없음.
- `main`에 push하면 GitHub Actions(`.github/workflows/pages.yml`)가 `public/`을 GitHub Pages에 배포한다. Cloudflare는 쓰지 않는다.
- 저장소는 공개다. 경로는 상대 경로로 쓴다 (사이트가 `/first/` 아래에 열린다).
- 커밋 작성자: `kyo-vcd <kyo.vcd@gmail.com>` (저장소 로컬 git config).
- 토큰, 비밀번호 등 비밀 값은 저장소에 넣지 않는다. Codex 로그인 정보(`~/.codex/`)도 마찬가지.
- 이미지는 Codex CLI(ChatGPT 구독 로그인)의 내장 image_gen으로 Claude가 직접 만든다. 절차·준비(네트워크 허용, `codex login --device-auth`)·가공 규칙은 [docs/image-generation.md](docs/image-generation.md). 생성 원본·프롬프트·가공 스크립트는 `docs/ref/images/assets/`에 남긴다.
