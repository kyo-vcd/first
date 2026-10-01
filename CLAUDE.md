# CLAUDE.md

프로젝트 정보, 배포 설정, 새 환경 설정은 [README.md](README.md)를 따른다.

- 사이트 파일은 `public/`에만 둔다. 빌드 단계 없음.
- `main`에 push하면 Cloudflare Pages(`kyo-first`)가 자동 배포한다. `wrangler deploy`나 수동 업로드는 쓰지 않는다.
- 커밋 작성자: `kyo-vcd <kyo.vcd@gmail.com>` (저장소 로컬 git config).
- 토큰, 비밀번호 등 비밀 값은 저장소에 넣지 않는다.
