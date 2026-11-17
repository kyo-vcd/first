# 과제 정리 — INTERACTIVE DESIGN class11

과제: **내 프로젝트에 기능 1개 구현해오기 & GitHub 가입하기** (`docs/ref/class11.pdf` 49쪽)

| 항목 | 내용 |
| --- | --- |
| 제출일시 | 다음 수업 전날 23:59까지 |
| 제출장소 | 구글 드라이브 (49쪽 링크) |
| 제출형식 | 폴더명 `학번_이름`, img · js · css · html 전부 포함 |

## 진행 상태

| 할 일 | 상태 |
| --- | --- |
| 기능 구현 (SCENE 01 스크롤 스토리텔링) | 완료 |
| GitHub 가입·저장소 | 완료 (`kyo-vcd/first`, 비공개) |
| 시안 확정 | 완료: 처음 구성(현재)으로 확정, 개선1 · 2와 비교 영역은 제거 |
| 제출 폴더 만들기 | `tools/make_submission.py` 실행 |
| 구글 드라이브 업로드 | 직접 |

## 제출 폴더 만들기

저장소 폴더에서 실행한다 (Python 3, 추가 설치 없음).

```bash
python3 tools/make_submission.py 학번_이름
```

- 결과: `dist/학번_이름/` 폴더와 `dist/학번_이름.zip`
- 하는 일: `public/` 전체(index.html · css · js · img)를 복사하고 zip으로 묶는다
- 배포 사이트와 저장소의 `public/`은 바뀌지 않는다. `dist/`는 git에 올라가지 않는다.
- 업로드 전에 `dist/학번_이름/index.html`을 브라우저로 열어 확인한다. 글꼴(Noto Sans KR)은 인터넷 연결이 있어야 보인다.

## 구현 내용과 강의 내용 대응

| 강의 (class11) | 이 프로젝트에서 | 파일 |
| --- | --- | --- |
| Part 1 State · Scene과 State의 차이 (5~7쪽) | 한 HTML 영역(`.scene-01`) 안에서 상태(step 0~4)만 바꿔 장면 4개를 표현 | `public/index.html` |
| 부모·자식 구조, 적용 범위 (8~9쪽) | 부모 `.scene-01` › 고정 `.sticky-screen` › 자식 `.s01-title` `.s01-stage` `.s01-tank` … 클래스는 모두 `s01-` 접두어로 다른 장면과 분리 | `public/index.html`, `docs/scenes/S01.md` |
| AI 요청 기본 형식 (10쪽) | 적용 범위 · 실행 조건 · 시작/종료 상태 · 유지 조건을 장면 명세로 정리 | `docs/scenes/S01.md` |
| Part 2 스크롤 진행률 0~1, sticky (13~17쪽) | 섹션별 진행률 계산, `position: sticky` 고정 화면 | `public/js/script.js`, `public/css/style.css` |
| 이미지 교체 Replace (21쪽) · 화면 진입형 (38쪽) | 진행률이 경계를 넘으면 상태 클래스(`is-step-N`)를 붙이고 CSS transition이 같은 시간으로 전환 → 스크롤 속도와 무관 | `public/js/script.js`, `public/css/scenes/s01.css` |
| Part 4 클릭에 따른 상태 변경 (26쪽) | 후원 금액 슬라이더 + 후원하기 → 동전 낙하, 금액에 따라 동전 수·문구가 함께 바뀜 | `public/js/scenes/s01.js` |
| 오류 확인과 부분 수정 요청 (20 · 35 · 42쪽) | 제목 겹침 → 사라짐·나타남 순서 분리, 스크롤 속도 문제 → 단계형 전환, 배지 겹침 → 위치 제한, 빈 스크롤 구간 → 구간 길이 조정 | git 커밋 이력 |
| 파일 분리 HTML · CSS · JS, 외부 라이브러리 없음 | `index.html` / `css/` / `js/` 분리, 라이브러리 없이 canvas로 동전 애니메이션 | `public/` |

## 최종 점검표 대비 (47쪽)

| 점검 항목 | 설명 근거 |
| --- | --- |
| 사용자 행동과 화면 상태 변화의 관계 | `docs/scenes/S01.md` 상태 표: 클릭(후원) → 동전 낙하, 스크롤 → STATE 03 · 04 |
| 독립 장면과 하나의 화면에서의 연속 상태 변화 구분 | 장면마다 HTML을 새로 만들지 않고 `.scene-01` 하나에서 `is-step-N` 클래스로 상태만 바꿈 |
| 기능을 적용할 부모 요소 찾기 | 부모 `.scene-01` (진행률 기준), 고정 영역 `.sticky-screen` |
| 부모 안에서 변경할 자식 요소 구분 | `.s01-title--ask/--split/--result`, `.s01-control`, `.s01-tank--field/--fund/--ops`, `.s01-tank-badge`, `.s01-next` |
| 프롬프트에 실행 조건과 시작·종료 상태 명시 | `docs/scenes/S01.md`의 step별 진행률 · 변화 순서 |
| HTML · CSS · JS를 알맞은 파일에 저장·연결 | `index.html`의 `<link>` · `<script>` 목록 (장면별 파일 한 줄씩) |
| 필요한 영역만 부분 수정 요청 | 수정 커밋이 모두 S01 파일 안에서만 이루어짐 (git 이력) |
| 다른 영역이 바뀌지 않았는지 확인 | 데스크톱 · 모바일 화면 캡처로 상태별 확인, 클래스 접두어로 범위 제한 |

## 제출 전 체크리스트

- [ ] `tools/make_submission.py`로 제출 폴더 생성
- [ ] 제출 폴더 `index.html`을 브라우저로 열어 후원 → 스크롤 → 결과까지 동작 확인
- [ ] 폴더명이 `학번_이름`인지 확인 후 구글 드라이브 업로드
- [ ] GitHub 저장소를 공개하거나 공유할 경우: 저장소 이력에 Cloudflare API 토큰이 남아 있으므로 먼저 Cloudflare에서 토큰을 폐기하고, `README.md`의 계정 정보를 정리
