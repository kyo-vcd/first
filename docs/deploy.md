# 배포 (Cloudflare Pages)

`main`에 push하면 Cloudflare Pages가 자동으로 배포한다. `wrangler deploy`나 수동 업로드는 쓰지 않는다.

- 다른 브랜치에 push하면 프리뷰 배포가 만들어진다 (`<브랜치>.kyo-first.pages.dev`).
- 배포 상태: Cloudflare 대시보드 → Workers & Pages → `kyo-first` → Deployments
- 되돌리기: `main`에서 `git revert` 후 push (강제 push로 이력을 지우지 않는다)

## 프로젝트 설정

| 항목 | 값 |
| --- | --- |
| Cloudflare 계정 | Wizdev.ge@gmail.com's Account (`e1d19b225590b32fbe1540af7eefa365`) |
| 프로젝트 이름 | `kyo-first` |
| Git 연동 | GitHub `kyo-vcd/first` (Cloudflare Workers and Pages GitHub 앱) |
| 프로덕션 브랜치 | `main` |
| 빌드 명령 | (없음) |
| 출력 디렉터리 | `public` |
| 프리뷰 배포 | 모든 브랜치 |

연결 정보(계정 ID, 프로젝트, 저장소 ID 등)는 `.env`에 있다. `CLOUDFLARE_API_TOKEN`을 채우면 Wrangler가 로그인 없이 동작한다.
저장소는 비공개이며, 공개로 바꾸기 전에 `.env`를 지우고 토큰을 폐기한다 (저장소 이력에 토큰이 남아 있다).

## Wrangler(Cloudflare CLI) — 필요할 때만

일반 배포는 push만으로 되므로 필요 없다. 프로젝트 관리가 필요할 때만 로그인한다.

```sh
npx wrangler login          # 브라우저에서 위 Cloudflare 계정으로 승인
npx wrangler pages project list
npx wrangler pages deployment list --project-name kyo-first
npx wrangler pages dev public   # 로컬 확인
```

## 프로젝트를 다시 만들어야 할 때

대시보드에서 Workers & Pages → Create → Pages → Connect to Git → `kyo-vcd/first` 를 고르고 위 표대로 설정한다.

API로 만들 때는 (토큰: `wrangler login` 후 Wrangler 설정 파일의 `oauth_token`, 또는 Pages 편집 권한이 있는 API 토큰):

```sh
curl -X POST "https://api.cloudflare.com/client/v4/accounts/e1d19b225590b32fbe1540af7eefa365/pages/projects" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"kyo-first","production_branch":"main",
       "build_config":{"build_command":"","destination_dir":"public"},
       "source":{"type":"github","config":{
         "owner":"kyo-vcd","owner_id":"335258148",
         "repo_name":"first","repo_id":"1398861403",
         "production_branch":"main","deployments_enabled":true,
         "production_deployments_enabled":true,"preview_deployment_setting":"all"}}}'
```

`owner_id`, `repo_id`가 빠지면 API가 알 수 없는 오류(8000000)를 반환한다.
Cloudflare 계정에 GitHub 앱이 연결되어 있지 않으면 대시보드에서 먼저 연결해야 한다.

## 이력

- 처음엔 Cloudflare Worker `first`(`first.wizdev-ge.workers.dev`)로 배포했다가 Pages(`kyo-first`)로 옮겼다. Worker는 삭제했다.
