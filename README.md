# first

인터랙티브 디자인 프로젝트 "1만 원의 경로 — 전장의 병원은 안전한가".
후원금 1만 원이 전장의 병원에 닿기까지를 8개 장면의 스크롤 스토리로 보여준다. Cloudflare Pages로 배포된다.

- 사이트: https://kyo-first.pages.dev
- 저장소: https://github.com/kyo-vcd/first

## 구조

```
public/                  # 배포되는 파일 (Pages 출력 디렉터리)
  index.html               # 한 페이지에 모든 장면을 <section class="scene">으로 이어 붙인다
  css/style.css            # 공통: 색·글꼴 토큰, .scene / .sticky-screen, 헤더·푸터
  css/scenes/s01.css       # 장면별 스타일
  js/script.js             # 공통: 스크롤 진행률(0~1) 계산, 장면 등록(Story.register)
  js/scenes/s01.js         # 장면별 상태 변화
  img/                     # 이미지 (제출 형식에 맞춰 img): 공통 bg.jpg · floor.png, 장면별 img/s01/
docs/
  assignment.md            # 과제 요건 · 제출 방법 · 강의 내용 대응
  image-prompts.md         # ChatGPT 이미지 소스 생성 프롬프트
  ref/                     # 수업 자료(class11.pdf), 장면 기획서(scene.pdf), images/시안 · images/assets(원본 소스 이미지)
  scenes/S01.md            # 장면별 구현 명세 (적용 범위·상태 변화·유지 조건)
tools/
  make_submission.py       # 과제 제출 폴더(학번_이름) 만들기 → dist/
```

빌드 단계는 없다. `public/` 안의 파일이 그대로 공개된다. 저장소 루트를 공개하지 않도록 사이트 파일은 반드시 `public/`에 둔다.
외부 라이브러리 없이 HTML·CSS·JavaScript만 쓴다.

### 장면 구조

모든 장면은 같은 부모·자식 구조를 쓴다.

```html
<section class="scene scene-02" data-scene="s02" data-no="02" data-title="화폐에서 생명으로">
  <div class="sticky-screen">   <!-- 스크롤 구간 동안 화면에 고정 -->
    …                           <!-- 상태가 바뀌는 자식 요소: 클래스는 s02- 접두어 -->
  </div>
</section>
```

- `.scene`의 높이(`--scene-length`, 예: `400vh`)가 스크롤 구간 길이다.
- `js/script.js`가 섹션마다 진행률을 0~1로 계산한다. 위로 스크롤하면 진행률이 줄어 변화가 되돌아간다.

### 스크롤 애니메이션 방식 (class11 21쪽 · 38쪽)

장면마다 내용에 맞는 방식을 고른다.

| 방식 | 등록 | 동작 | 쓰는 곳 |
| --- | --- | --- | --- |
| 상태 단계형 | `steps: [0.12, 0.40, …]`, `onStep(step)` | 진행률이 경계를 넘으면 `<section>`에 `data-step`과 누적 클래스 `is-step-N`이 붙고, CSS `transition`이 같은 시간으로 전환을 재생한다. 스크롤 속도와 무관하다. | 문장을 읽게 하는 장면, 단계가 넘어가는 장면 (S01·S02·S03·S07) |
| 스크롤 연동형 | `update(progress)` | 진행률(부드럽게 보간)을 매 프레임 받아 값을 비례해서 바꾼다. | 스크롤 위치 자체가 의미인 변화 (S04 타임라인 등) |

단계형 스크롤 길이: 전환은 1초 안에 끝나므로 상태 하나에 휠 3~4칸(약 35~40vh)만 배정한다. 길게 잡으면 스크롤해도 아무 변화가 없는 구간이 생긴다. `--scene-length` ≈ 100vh + 상태 수 × 35~40vh.

단계형 CSS 규칙: 사라지는 요소가 먼저, 나타나는 요소는 `transition-delay`로 뒤에 둔다.
되돌아갈 때는 기본 규칙의 delay가 쓰이므로 기본 규칙에도 역순 delay를 준다. 예시는 `css/scenes/s01.css`.
- 장면 안의 요소만 다루고, 다른 장면에는 영향을 주지 않는다.

### 새 장면 추가 (예: SCENE 02)

1. `docs/scenes/S02.md`에 적용 범위, 상태 변화(시작·종료 상태, 진행률 구간), 유지 조건을 적는다.
2. `index.html`의 `<!-- 다음 장면 자리 -->`에 `<section class="scene scene-02" data-scene="s02" …>`을 추가한다.
3. `css/scenes/s02.css`, `js/scenes/s02.js`를 만들고 `index.html`의 `<link>`, `<script>` 목록에 한 줄씩 추가한다.
4. `js/scenes/s02.js`에서 `Story.register('s02', function (root) { return { steps: […], onStep: … }; })`처럼 등록한다 (연동형이면 `update`).
5. 푸터의 "다음 장면" 문구를 갱신한다.

## 배포

`main` 브랜치에 push하면 Cloudflare Pages가 자동으로 배포한다. 별도 명령은 필요 없다.

- 다른 브랜치에 push하면 프리뷰 배포가 만들어진다 (`<hash>.kyo-first.pages.dev`).
- 배포 상태는 Cloudflare 대시보드 → Workers & Pages → `kyo-first` → Deployments 에서 확인한다.

### Cloudflare Pages 프로젝트 설정

| 항목 | 값 |
| --- | --- |
| Cloudflare 계정 | Wizdev.ge@gmail.com's Account (`e1d19b225590b32fbe1540af7eefa365`) |
| 프로젝트 이름 | `kyo-first` |
| Git 연동 | GitHub `kyo-vcd/first` (Cloudflare Workers and Pages GitHub 앱) |
| 프로덕션 브랜치 | `main` |
| 빌드 명령 | (없음) |
| 출력 디렉터리 | `public` |
| 프리뷰 배포 | 모든 브랜치 |

## 새 개발환경 설정

```sh
git clone https://github.com/kyo-vcd/first.git
cd first
git config user.name "kyo-vcd"
git config user.email "kyo.vcd@gmail.com"
```

연결 정보(계정 ID, 프로젝트, 저장소 ID 등)는 `.env`에 있다. `CLOUDFLARE_API_TOKEN`을 채우면
Wrangler가 로그인 없이 동작한다. 저장소는 비공개이며, 공개로 바꾸기 전에 `.env`를 지우고 토큰을 폐기한다.

로컬 확인은 `public/index.html`을 브라우저로 열거나 아래처럼 띄운다.

```sh
npx wrangler pages dev public
```

### Wrangler(Cloudflare CLI) 로그인 — 필요할 때만

일반 배포는 push만으로 되므로 필요 없다. 프로젝트 관리나 수동 배포가 필요할 때만 로그인한다.

```sh
npx wrangler login          # 브라우저에서 위 Cloudflare 계정으로 승인
npx wrangler pages project list
npx wrangler pages deployment list --project-name kyo-first
```

## 프로젝트를 다시 만들어야 할 때

Pages 프로젝트가 삭제된 경우 대시보드에서 Workers & Pages → Create → Pages → Connect to Git →
`kyo-vcd/first` 를 고르고 위 표대로 설정한다.

API로 만들 때는 (토큰은 `wrangler login` 후 Wrangler 설정 파일의 `oauth_token`, 또는 Pages 편집 권한이 있는 API 토큰):

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
