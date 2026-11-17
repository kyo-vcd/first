# 이미지 생성 방식 (Codex CLI + ChatGPT 구독)

장면 이미지는 **Claude가 Codex CLI로 직접 만든다**. ChatGPT 구독 계정으로 로그인해 쓰므로 API 키나 API 요금이 들지 않는다.
SCENE 01의 배경 · 바닥 · 동전이 이 방식으로 만들어졌다 (결과와 프롬프트: `docs/ref/images/assets/codex/`).

## 1. 준비 (새 환경에서 한 번)

| 항목 | 내용 |
| --- | --- |
| 네트워크 허용 | 클라우드 환경 설정의 허용 도메인에 `chatgpt.com`, `auth.openai.com`, `api.openai.com` |
| 설치 | `npm i -g @openai/codex` (확인한 버전: 0.169.0) |
| 로그인 | `codex login --device-auth` → 나오는 주소(https://auth.openai.com/codex/device)를 휴대폰·PC 브라우저에서 열고 코드 입력 |
| 확인 | `codex login status` → `Logged in using ChatGPT` / `codex features list` 에서 `image_generation  stable  true` |

- 로그인 정보는 컨테이너의 `~/.codex/`에만 있다. **저장소에 넣지 않는다.** 컨테이너가 재시작되면 다시 로그인한다.
- 이미지를 만들 때마다 ChatGPT 구독 사용량이 차감된다.

## 2. 모델

- 구독 로그인으로 쓰는 내장 도구(`image_gen.imagegen`)는 인자가 `prompt`, `referenced_image_paths`, `transparent_background`, `num_last_images_to_include` 뿐이다. **모델을 고를 수 없고** OpenAI가 정한 기본 모델이 쓰인다 (결과 파일의 C2PA 정보: ChatGPT / gpt-image).
- `gpt-image-2` 같은 모델 지정은 Codex의 예비 CLI 경로로만 되고 `OPENAI_API_KEY`(API 요금)가 필요하다. 이 프로젝트는 쓰지 않는다 (사용자 결정).
- 내장 도구는 투명 배경(`transparent_background=true`)을 지원한다.

## 3. 만드는 순서

1. **시안을 잘라 참고 이미지로 만든다.** 원하는 부분을 크게 자른 것과 더 확대한 것 2장을 준다 (예: 동전 영역, 동전 몇 개 확대).
   시안: `docs/ref/images/시안/`
2. **프롬프트를 쓴다.** 영어로, 아래 항목을 빠짐없이 적는다.
   - "Use the built-in image_gen tool", 참고 이미지 파일 이름과 "match as closely as possible"
   - 크기·비율, 투명 배경 여부 (`transparent_background=true`)
   - 배치 (예: 2×2 격자, 칸의 80% 크기, 서로 닿지 않게)
   - 시안에서 본 특징을 구체적으로: 색(hex), 테두리·홈·문양, 질감(점 밀도), 하지 말 것(no text, no glossy 3D, no emblem …)
   - 저장: "Save it as <이름>.png in the current directory and print its pixel size."
   - 한 세트가 같아야 하면(금화 → 핏자국 금화) **1단계로 만들고 2단계에서 그 파일을 참고 이미지로 편집**하게 한다.
3. **실행한다.** 작업 폴더는 scratchpad에 두고, 여러 장은 폴더를 나눠 동시에 실행한다 (1장에 1~3분).
   ```bash
   tools/codex_image.sh <작업폴더> <프롬프트파일> ref-a.png ref-b.png
   ```
4. **시안과 비교한다.** 결과를 확인하고(투명 부분은 색 배경에 얹어 보기), 사이트에 넣어 같은 상태를 캡처해 시안과 나란히 본다.
   다르면 다른 점을 프롬프트에 구체적으로 적어 다시 만든다 (S01 동전: 1차는 문양이 너무 또렷 → 2차 "only a very faint mark, no emblem").
5. **가공해서 `public/img/`에 넣는다.** (`docs/ref/images/assets/codex/process.py` 참고)
   - **색 맞추기**: 시안의 같은 영역 평균 색을 재서 채널별로 맞춘다 (생성 결과는 대개 더 밝고 채도가 높다).
   - 시트는 칸별로 잘라 여백을 없애고 쓰는 크기로 줄인다 (동전 160px).
   - 화면에서 작게 보이는 것은 줄인 뒤 선명하게(UnsharpMask) · 질감 대비를 키운다. 그대로 두면 뭉개진다.
   - 가로로 반복하는 것(바닥)은 양 끝을 섞어 이음매를 없앤다.
   - 배경은 JPG(q82), 투명이 필요한 것만 PNG.
6. **원본을 남긴다.** 생성 원본 · 프롬프트 · 가공 스크립트를 `docs/ref/images/assets/codex/`(장면이 늘면 장면별 폴더)에 저장하고,
   스크립트를 저장소 루트에서 다시 돌려 `public/img/`가 똑같이 나오는지 확인한다.
7. 데스크톱 · 모바일 캡처로 확인 → 커밋 → `main` 릴리즈 → 필요하면 제출 파일 다시 만들기.

## 4. S01 기록

| 파일 | 방식 | 비고 |
| --- | --- | --- |
| `img/bg.jpg` | Codex 1차 | 시안 전체 + 위쪽 확대를 참고, 색 (21,17,16)에 맞춤 |
| `img/floor.png` | Codex 2차 | "fine uniform grain, no cloudy blotches", 색 (83,26,21), 입자 대비 2배, 이음매 제거 |
| `img/s01/coin-gold-1~4.png`, `coin-blood-1·4.png` | Codex 2차 | 금화 생성 → 같은 시트를 편집해 핏자국, 색 (160,119,52), 선명하게 |
| `img/s01/stamp.png`, `thumb.png`, `drip-1·2.png` | ChatGPT 웹 (처음 방식) | `docs/image-prompts.md`, 원본 `docs/ref/images/assets/` |

다시 만들기: `python3 docs/ref/images/assets/codex/process.py` (numpy, Pillow 필요)
