#!/bin/bash
# Codex CLI(ChatGPT 계정 로그인)의 내장 image_gen 으로 이미지 만들기
#
# 사용법:
#   tools/codex_image.sh <작업폴더> <프롬프트파일> [참고이미지 ...]
#   예) tools/codex_image.sh /tmp/gen/coins docs/ref/images/assets/codex/coins.prompt.txt ref-coins.png
#
# - 참고 이미지는 작업폴더 안의 파일 이름(또는 절대 경로)으로 준다. 프롬프트에서 그 이름을 부른다.
# - 프롬프트에는 "만든 파일을 현재 폴더에 <이름>.png 로 저장" 을 꼭 적는다.
# - 결과 로그: <작업폴더>/log.txt (마지막 줄 "exit 0" 이면 정상 종료)
# - 여러 개를 동시에 만들려면 작업폴더를 나눠 & 로 실행하고 wait.
# 자세한 절차: docs/image-generation.md

set -u
if [ $# -lt 2 ]; then sed -n 2,12p "$0"; exit 1; fi
dir=$1; prompt_file=$2; shift 2
mkdir -p "$dir"
prompt=$(cat "$prompt_file")
args=()
for i in "$@"; do args+=(-i "$i"); done

if ! codex login status >/dev/null 2>&1; then
  echo "Codex 로그인이 필요합니다: codex login --device-auth" >&2
  exit 2
fi

cd "$dir" || exit 1
timeout 900 codex exec --skip-git-repo-check -s workspace-write "${args[@]}" -- "$prompt" > log.txt 2>&1
code=$?
echo "exit $code" >> log.txt
tail -5 log.txt | sed 's/\x1b\[[0-9;]*m//g'
exit $code
