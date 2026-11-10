#!/bin/bash
# Turns your friends' birthday videos into small, web-friendly MP4s plus a
# poster frame for each. Put the originals in raw/ (any phone video works:
# .MOV, .MP4…), then run:   ./transcode.sh
# Output: media/videos/<name>.mp4 and media/posters/<name>.jpg
# Originals are never modified. Needs ffmpeg (brew install ffmpeg).
set -e
cd "$(dirname "$0")"
command -v ffmpeg >/dev/null || { echo "ffmpeg not found: install it first (macOS: brew install ffmpeg)"; exit 1; }
mkdir -p raw media/videos media/posters
shopt -s nullglob nocaseglob
found=0
for f in raw/*.mov raw/*.mp4 raw/*.m4v raw/*.webm; do
  found=1
  name=$(basename "$f"); name="${name%.*}"
  key=$(echo "$name" | tr 'A-Z' 'a-z' | sed -E 's/[^a-z0-9]+/-/g; s/^-|-$//g')
  out="media/videos/$key.mp4"
  if [ -f "$out" ]; then echo "skip  $out (already made)"; else
    echo "make  $out"
    ffmpeg -v error -y -i "$f" -map 0:v:0 -map '0:a:0?' \
      -vf "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))',format=yuv420p" \
      -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -movflags +faststart "$out"
  fi
  ffmpeg -v error -y -ss 1.2 -i "$out" -frames:v 1 -vf "scale=360:-2" -q:v 4 "media/posters/$key.jpg"
  echo "      in world.config.js:  video: '$out', poster: 'media/posters/$key.jpg'"
done
[ $found = 1 ] || echo "No videos in raw/ yet: drop your friends' videos there and run this again."
