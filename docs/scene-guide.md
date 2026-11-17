# 장면 만들기 가이드

모든 장면은 한 페이지(`public/index.html`) 안에 `<section class="scene">`으로 이어 붙인다.
장면마다 명세(`docs/scenes/SXX.md`), 스타일(`css/scenes/sXX.css`), 스크립트(`js/scenes/sXX.js`)를 따로 둔다.

## 구조

```html
<section class="scene scene-02" data-scene="s02" data-no="02" data-title="화폐에서 생명으로">
  <div class="sticky-screen">   <!-- 스크롤 구간 동안 화면에 고정 -->
    …                           <!-- 상태가 바뀌는 자식 요소: 클래스는 s02- 접두어 -->
  </div>
</section>
```

- `.scene`의 높이(`--scene-length`)가 스크롤 구간 길이다. `js/script.js`가 섹션마다 진행률을 0~1로 계산한다.
- 위로 스크롤하면 진행률이 줄어 변화가 되돌아간다.
- 장면 안의 요소만 다루고, 다른 장면에는 영향을 주지 않는다.

## 스크롤 애니메이션 방식 (class11 21쪽 · 38쪽)

| 방식 | 등록 | 동작 | 쓰는 곳 |
| --- | --- | --- | --- |
| 상태 단계형 | `steps: [0.15, 0.40, …]`, `onStep(step)` | 진행률이 경계를 넘으면 `<section>`에 `data-step`과 누적 클래스 `is-step-N`이 붙고, CSS `transition`이 같은 시간으로 전환한다. 스크롤 속도와 무관하다. | 문장을 읽게 하는 장면, 단계가 넘어가는 장면 (S01 · S02 · S03 · S07) |
| 스크롤 연동형 | `update(progress)` | 진행률(부드럽게 보간)을 매 프레임 받아 값을 비례해서 바꾼다. | 스크롤 위치 자체가 의미인 변화 (S04 타임라인 등) |

### 단계형 규칙

- **스크롤 길이:** 전환은 1초 안에 끝나므로 상태 하나에 휠 3~4칸(약 35~40vh)만 준다. `--scene-length` ≈ 100vh + 상태 수 × 35~40vh. 길면 아무 변화 없는 구간이 생긴다.
- **터치 화면:** 한 번 쓸 때 움직이는 거리가 길어 상태 사이를 화면 80% 정도로 넓힌다.
  예: `@media (pointer: coarse) { .scene-01 { --scene-length: 420vh; } }`
- **순서:** 사라지는 요소가 먼저, 나타나는 요소는 `transition-delay`로 뒤에 둔다. 되돌아갈 때는 기본 규칙의 delay가 쓰이므로 기본 규칙에도 역순 delay를 준다. 예시는 `css/scenes/s01.css`.
- **공통 동작 (`js/script.js`가 처리):**
  - 상태는 한 칸씩, 최소 0.5초 간격으로 넘어간다. 빠르게 스크롤해도 전환이 겹치지 않는다.
  - 터치 화면에서는 상태마다 자동으로 만든 `.snap-point`에서 멈춘다.
  - 진행률은 모바일 주소창과 무관한 높이(100lvh)로 계산한다. 고정 화면도 100lvh이고, 아래쪽에 붙는 내용은 `var(--toolbar)`(주소창 높이)만큼 올린다.

## 새 장면 추가 (예: SCENE 02)

1. `docs/scenes/S02.md`에 적용 범위, 상태 변화(시작·종료 상태, 진행률 구간), 유지 조건을 적는다.
2. `index.html`의 `<!-- 다음 장면 자리 -->`에 `<section class="scene scene-02" data-scene="s02" …>`을 추가한다.
3. `css/scenes/s02.css`, `js/scenes/s02.js`를 만들고 `index.html`의 `<link>`, `<script>` 목록에 한 줄씩 추가한다.
4. `js/scenes/s02.js`에서 `Story.register('s02', function (root) { return { steps: […], onStep: … }; })`처럼 등록한다 (연동형이면 `update`).
5. 이미지가 필요하면 `docs/image-generation.md` 방식으로 만든다.
6. 새 글자가 생겼으니 `python3 tools/build_fonts.py`로 글꼴을 다시 만든다.
7. 푸터의 "다음 장면" 문구를 갱신한다.
