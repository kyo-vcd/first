# 과제 정리 — INTERACTIVE DESIGN

## class12 (12주차) — AI 코딩 에이전트 활용과 웹사이트 배포

강의안: `docs/ref/class12.pdf`

| 항목 | 내용 | 상태 |
| --- | --- | --- |
| 과제 (13주차까지) | GitHub URL을 수업 스프레드시트에 올리기 (강의안 마지막 쪽 링크) | 올릴 주소: https://kyo-vcd.github.io/first/ |
| 13주차 수업 | 개인 프로젝트 작업 및 피드백 | |

강의 점검표 대비

| 점검 항목 | 이 프로젝트 |
| --- | --- |
| 에이전트에 부모 영역 · 자식 요소 · 실행 조건 명시 | Claude Code(코딩 에이전트)에 장면 명세(`docs/scenes/S01.md`) 기준으로 요청 |
| 변경 파일 · 적용 내용 확인, 부분 수정 요청 | 커밋마다 변경 파일 기록, 오류는 원인 확인 후 해당 부분만 수정 (git 이력) |
| 저장소 생성 · Commit · Push | `kyo-vcd/first` (공개) |
| GitHub Pages에서 HTML · CSS · JS 정상 작동 | https://kyo-vcd.github.io/first/ — 데스크톱 · 모바일에서 후원 · 스크롤 · 글꼴 · 이미지 확인 |
| 로컬과 배포 페이지 차이 점검 | 모든 경로를 상대 경로로 써서 `/first/` 하위에서도 동일하게 동작 |

장면별 부모 · 자식 · 실행 조건 (class12 "다섯 가지 정보"로 쓴 명세: `docs/scenes/S0N.md`)

| 장면 | 부모 영역 | 이벤트 대상 | 변경할 자식 | 강의 내용 |
| --- | --- | --- | --- | --- |
| 01 | `.scene-01` | 금액 슬라이더 · 후원하기 버튼 · 스크롤 | `.s01-tank` · `.s01-coins` · `.s01-title` | 클릭 상태 변경, 단계형 스크롤 |
| 02 | `.scene-02` | 키트 만들기 버튼 · 스크롤 | `.s02-item` · `.s02-crate` · `.s02-title` | 클릭 상태 변경 |
| 03 | `.scene-03` | 스크롤 | `.s03-zone` · `.s03-hospital-lit` · `.s03-card` | 이미지 교체(Replace), 화면 진입형 |
| 04 | `.scene-04` | 스크롤 진행률 | `.s04-hit` · `.s04-count` · `.s04-year` | 스크롤 진행률 0~1 연동 |
| 05 | `.scene-05` | 공식 보호 좌표 / 실제 공습 타깃 버튼 | `.s05-panel` · `.s05-scope` · `.s05-stat` | 버튼 A/B 전환 (12주차 공통 예제와 같은 구조) |
| 06 | `.scene-06` | 타임라인 슬라이더 (드래그 · 키보드 · 재생) | `.s06-building` · `.s06-log` · `.s06-toll` | 입력값에 따른 상태 변경 |
| 07 | `.scene-07` | 스크롤 | `.s07-lamp` · `.s07-ecg` · `.s07-kit` | 단계형 스크롤 |
| 08 | `.scene-08` | 반경 슬라이더 · 서명 버튼 | `.s08-lights` · `.s08-stats` · `.s08-end` | 입력값 연동 + 클릭 |

검토 · 배포: 장면 하나를 만들 때마다 데스크톱 · 노트북 · 휴대폰 크기로 실행해 확인 → 커밋 → GitHub Pages 배포 → 배포 주소에서 다시 확인 (git 이력).

파일 이름 규칙 (강의안 2쪽): `index.html` 필수, 이미지는 폴더에, 한글 · 띄어쓰기 금지, 여러 단어는 camelCase 또는 snake_case.
→ 적용함: 이미지 폴더 `images/`, 파일 · 폴더 이름은 모두 snake_case (예: `images/s01/coin_gold_1.png`, `fonts/noto_sans_kr_400.woff2`, `docs/ref/images/mockup/`).

## class11 (11주차)

과제: **내 프로젝트에 기능 1개 구현해오기 & GitHub 가입하기** (`docs/ref/class11.pdf` 49쪽)

| 항목 | 내용 |
| --- | --- |
| 제출일시 | 다음 수업 전날 23:59까지 |
| 제출장소 | 구글 드라이브 (49쪽 링크) |
| 제출형식 | 폴더명 `학번_이름`, images · js · css · html 전부 포함 |

## 진행 상태

| 할 일 | 상태 |
| --- | --- |
| 기능 구현 (SCENE 01 스크롤 스토리텔링) | 완료 |
| GitHub 가입·저장소 | 완료 (`kyo-vcd/first`, 공개 · 사이트 https://kyo-vcd.github.io/first/) |
| 시안 확정 | 완료: 처음 구성(현재)으로 확정, 개선1 · 2와 비교 영역은 제거 |
| 제출 폴더 만들기 | `tools/make_submission.py` 실행 |
| 구글 드라이브 업로드 | 직접 |

## 제출 폴더 만들기

저장소 폴더에서 실행한다 (Python 3, 추가 설치 없음).

```bash
python3 tools/make_submission.py 학번_이름
```

- 결과: `dist/학번_이름/` 폴더와 `dist/학번_이름_YYYYMMDD_HHMM.zip` (만든 날짜·시간, 한국 시간. 압축 안의 폴더 이름은 `학번_이름` 그대로)
- 하는 일: `public/` 전체(index.html · css · js · img)를 복사하고 zip으로 묶는다
- 배포 사이트와 저장소의 `public/`은 바뀌지 않는다. `dist/`는 git에 올라가지 않는다.
- 업로드 전에 `dist/학번_이름/index.html`을 브라우저로 열어 확인한다. 글꼴(Noto Sans KR)은 `fonts/`에 포함되어 오프라인에서도 보인다.

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
