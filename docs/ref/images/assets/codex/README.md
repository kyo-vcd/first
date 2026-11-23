# Codex 생성 원본 (SCENE 01)

절차는 `docs/image_generation.md`.

| 파일 | 내용 |
| --- | --- |
| `bg.png`, `floor.png`, `coin_gold.png`, `coin_blood.png` | Codex 내장 image_gen 생성 원본 |
| `bg.prompt.txt`, `floor.prompt.txt`, `coins.prompt.txt` | 쓴 프롬프트 (`tools/codex_image.sh`에 그대로 넘긴다) |
| `prompts.sh` | 같은 프롬프트를 한 파일에 모은 것 |
| `process.py` | 원본 → `public/images/` 가공 (시안 색 맞춤 · 자르기 · 선명하게 · 이음매 제거) |

참고 이미지(ref_*.png)는 시안 `docs/ref/images/mockup/mockup_3.png`에서 잘랐다.
- `ref_coins.png`: (200,480)-(700,900) 를 1000×840 으로 확대 · `ref_coins_zoom.png`: (300,560)-(460,700) 를 640×560 으로
- `ref_mockup.png`: 전체를 1536×864 로 · `ref_top.png`: (0,0)-(1920,260)
- `ref_floor.png`: (0,900)-(1920,1080) · `ref_floor_zoom.png`: (0,1000)-(640,1080) 를 1280×160 으로
