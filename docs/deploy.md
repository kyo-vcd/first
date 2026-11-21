# 배포 (GitHub Pages)

`main`에 push하면 GitHub Actions가 `public/` 폴더를 GitHub Pages에 배포한다. 별도 명령은 필요 없다.

- 사이트: https://kyo-vcd.github.io/first/
- 워크플로: `.github/workflows/pages.yml` (`public/`을 그대로 올린다, 빌드 없음)
- 배포 상태: 저장소 → Actions → "Deploy public/ to GitHub Pages"
- 수동 재배포: Actions → 같은 워크플로 → Run workflow
- 되돌리기: `main`에서 `git revert` 후 push (강제 push로 이력을 지우지 않는다)

## 설정

| 항목 | 값 |
| --- | --- |
| 저장소 | `kyo-vcd/first` (공개) |
| Pages 소스 | Settings → Pages → Source: **GitHub Actions** |
| 배포 브랜치 | `main` |
| 배포 폴더 | `public/` |

- 사이트가 `/first/` 아래에 열리므로 HTML · CSS · JS의 경로는 모두 상대 경로로 쓴다 (`/`로 시작하는 절대 경로 금지).
- `main` 외의 브랜치는 배포되지 않는다. 확인은 로컬에서 `public/index.html`을 연다.

## 이력

- Cloudflare Worker → Cloudflare Pages를 거쳐 GitHub Pages로 옮겼다. Cloudflare는 더 이상 쓰지 않는다 (API 토큰 폐기함).
