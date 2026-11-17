# CLAUDE.md

프로젝트 구조와 작업 방법은 [README.md](README.md), 배포 설정은 [docs/deploy.md](docs/deploy.md), 장면 구현 규칙은 [docs/scene-guide.md](docs/scene-guide.md)를 따른다.

- 사이트 파일은 `public/`에만 둔다. 빌드 단계 없음.
- `main`에 push하면 Cloudflare Pages(`kyo-first`)가 자동 배포한다. `wrangler deploy`나 수동 업로드는 쓰지 않는다.
- 커밋 작성자: `kyo-vcd <kyo.vcd@gmail.com>` (저장소 로컬 git config).
- 토큰, 비밀번호 등 비밀 값은 저장소에 넣지 않는다. Codex 로그인 정보(`~/.codex/`)도 마찬가지.
- 이미지는 Codex CLI(ChatGPT 구독 로그인)의 내장 image_gen으로 Claude가 직접 만든다. 절차·준비(네트워크 허용, `codex login --device-auth`)·가공 규칙은 [docs/image-generation.md](docs/image-generation.md). 생성 원본·프롬프트·가공 스크립트는 `docs/ref/images/assets/`에 남긴다.
