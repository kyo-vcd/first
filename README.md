# 1만 원의 경로 — 전장의 병원은 안전한가

INTERACTIVE DESIGN 수업 과제 (class11: 내 프로젝트에 기능 1개 구현하기)

- 사이트: https://kyo-vcd.github.io/first/
- 기획: 후원금 1만 원이 전장의 병원에 닿기까지를 8개 장면의 스크롤 스토리로 보여준다. 현재 SCENE 01 구현.

## 구현한 기능 (SCENE 01)

1. 후원 금액을 고르고 **후원하기**를 누르면 동전이 86 : 10 : 4 비율로 세 수조에 떨어진다.
2. 스크롤하면 한 화면 안에서 상태가 바뀐다: 분배 확인 → 결과 확인 → 다음 장면 질문.

자세한 내용: [docs/scenes/S01.md](docs/scenes/S01.md) · 강의 내용 대응: [docs/assignment.md](docs/assignment.md)

## 파일

| 위치 | 내용 |
| --- | --- |
| `public/index.html` | 페이지 (장면마다 `<section class="scene">`) |
| `public/css/`, `public/js/` | 공통 파일 + 장면별 파일 (`scenes/s01.*`) |
| `public/img/`, `public/fonts/` | 이미지, 글꼴 |
| `docs/` | 과제 정리, 장면 명세, 작업 가이드 |

HTML · CSS · JavaScript만 사용 (외부 라이브러리 없음). `public/index.html`을 브라우저로 열면 바로 실행된다.
