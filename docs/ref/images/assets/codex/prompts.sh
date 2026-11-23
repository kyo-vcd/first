#!/bin/bash
# Codex CLI(ChatGPT 계정 로그인)의 내장 image_gen 으로 S01 소스 이미지를 만든 프롬프트.
# 참고 이미지(ref_*.png)는 docs/ref/images/mockup/ 의 두 번째 시안(mockup_3)을 잘라 만들었다.
# 실행 예: codex exec --skip-git-repo-check -s workspace-write -i ref_coins.png -- "$COINS"

BG='Use the built-in image_gen tool. Attached ref_mockup.png is the target web design and ref_top.png is a full-resolution crop of its top edge. Generate bg.png: ONLY the background texture of that design, with all text, coins, tank lines, red floor and UI removed. Landscape 3:2 image, fully opaque.
- Charred dark brown-black paper, base about #1E1916, a little lighter in the center and darker toward the edges, same brightness as the reference background.
- Clearly visible fine paper grain and speckle noise, like a risograph print.
- About 25 thin faint light scratches in random diagonal directions spread over the whole image.
- Across the top 18% only: a faint repeating pattern of small blood-drop (teardrop) shapes in staggered rows, slightly lighter than the background, fading out downward exactly like ref_top.png.
- The lower part stays plain dark texture (no floor). No text, no logos.
Save it as bg.png in the current directory and print its pixel size.'

COINS='Use the built-in image_gen tool. Attached ref_coins.png and ref_coins_zoom.png are crops of the target design; match those coins as closely as possible.

Step 1. Generate coin_gold.png with transparent_background=true: a square image with a 2x2 grid of 4 coins, each centered in its quarter, diameter about 80% of the quarter, not touching.
What the reference coins look like (copy this exactly):
- Dull, slightly dirty antique gold, NOT saturated orange: mid tone #A88A45, lighter rim #C4A253, dark details #4A3714.
- A wide flat outer rim band, then a clearly visible DARK thin ring (a recessed groove) at about 70% of the radius, then the flat inner face.
- The inner face has only a very faint, barely visible worn mark in the center (almost erased). No clear emblem, no flowers, no stars, no symbols.
- Heavy, coarse black speckle/halftone dots over the entire coin, like a worn screen print or photocopy; the speckle is dense enough to darken the coin noticeably.
- A thin dark outline around each coin.
- Flat 2D printed look, no glossy shine, no 3D bevel lighting, no text, no blood.
The 4 coins look nearly identical; only the speckle pattern differs.

Step 2. Edit coin_gold.png (pass it as referenced image, transparent_background=true) to make coin_blood.png: the same 4 coins and layout, each with one bright red (#D9252A) blood blotch like the reference: a rough round blotch about 30-35% of the coin diameter with a couple of tiny splatter dots, covered by the same black speckle. Different position on each coin (center, upper left, lower right, near the rim).

Save both files in the current directory with exactly those names, then print their pixel sizes.'

FLOOR='Use the built-in image_gen tool with transparent_background=true. Attached ref_floor.png and ref_floor_zoom.png are crops of the bottom edge of the target design. Generate floor.png, a wide landscape 3:2 image: only the bottom 22% is painted, everything above is fully transparent.
- The painted strip is a dark blood red (#7E2018 average) made of FINE, UNIFORM grain: tiny red and near-black specks like sandpaper or a risograph print, evenly spread. No cloudy blotches, no large mottled patches, no gradients inside the strip except a soft fade at the top edge.
- The top edge fades softly to transparent over a short distance.
- One thin dark barbed wire runs horizontally across the strip near its top: two thin twisted strands with small X-shaped barbs at regular intervals, like the reference.
- The left and right edges must tile seamlessly. No text.
Save it as floor.png in the current directory and print its pixel size.'
