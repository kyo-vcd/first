# first

인터랙티브 디자인 과제 프로젝트 "1만 원의 경로 — 전장의 병원은 안전한가".
후원금 1만 원이 전장의 병원에 닿기까지를 8개 장면의 스크롤 스토리로 보여준다. 지금은 SCENE 01까지 만들었다.

- 사이트: https://kyo-vcd.github.io/first/
- 저장소: https://github.com/kyo-vcd/first

## 구조

```
public/                    배포되는 파일 (빌드 없음, 이 폴더만 공개)
  index.html               한 페이지에 모든 장면을 <section class="scene">으로 이어 붙인다
  css/style.css            공통: 색·글꼴, .scene / .sticky-screen, 헤더·푸터
  css/scenes/s01.css       장면별 스타일
  js/script.js             공통: 스크롤 진행률, 상태 전환, 장면 등록(Story.register)
  js/scenes/s01.js         장면별 상태 변화
  fonts/                   Noto Sans KR (페이지에 쓰인 글자만)
  img/                     이미지 (공통 bg.jpg · floor.png, 장면별 img/s01/)
docs/
  assignment.md            과제 요건 · 제출 방법 · 강의 내용 대응
  scene-guide.md           장면 만들기 (구조, 스크롤 방식, 새 장면 추가)
  scenes/S01.md            장면별 명세 (적용 범위 · 상태 변화 · 유지 조건 · 비주얼)
  image-generation.md      이미지 만들기 (Codex CLI + ChatGPT 구독)
  image-prompts.md         (처음 방식) ChatGPT 웹용 프롬프트
  deploy.md                배포 (GitHub Pages)
  ref/                     수업 자료 · 기획서 PDF, images/시안 · images/assets(이미지 원본)
tools/
  make_submission.py       과제 제출 폴더 + zip 만들기
  build_fonts.py           글꼴 다시 만들기
  codex_image.sh           Codex로 이미지 만들기
```

외부 라이브러리 없이 HTML · CSS · JavaScript만 쓴다.

## 작업 방법

| 할 일 | 방법 |
| --- | --- |
| 로컬 확인 | `public/index.html`을 브라우저로 연다 (오프라인도 됨) |
| 장면 추가 | [docs/scene-guide.md](docs/scene-guide.md) |
| 이미지 만들기 | [docs/image-generation.md](docs/image-generation.md) |
| 문구 변경 · 장면 추가 후 글꼴 | `pip install fonttools brotli` → `python3 tools/build_fonts.py` |
| 제출 파일 | `python3 tools/make_submission.py 학번_이름` → `dist/학번_이름_날짜_시간.zip` ([docs/assignment.md](docs/assignment.md)) |
| 배포 | `main`에 push하면 GitHub Pages에 자동 배포 ([docs/deploy.md](docs/deploy.md)) |

## 새 개발환경

```sh
git clone https://github.com/kyo-vcd/first.git
cd first
git config user.name "kyo-vcd"
git config user.email "kyo.vcd@gmail.com"
```
