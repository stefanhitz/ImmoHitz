#!/usr/bin/env bash
# Resize source photos into web-friendly listing/team images + thumbnails using sips.
# Usage: scripts/process-images.sh <source-dir> <dest-dir> <file1> [file2 ...]
set -euo pipefail

SRC_DIR="$1"
DEST_DIR="$2"
shift 2

mkdir -p "$DEST_DIR" "$DEST_DIR/thumbs"

for name in "$@"; do
  src="$SRC_DIR/$name"
  base="$(basename "$name" | tr '[:upper:]' '[:lower:]' | sed 's/\.[^.]*$//')"
  out="$DEST_DIR/${base}.jpg"
  thumb="$DEST_DIR/thumbs/${base}.jpg"

  cp "$src" "$out"
  sips -Z 1400 -s format jpeg -s formatOptions 70 "$out" >/dev/null

  cp "$src" "$thumb"
  sips -Z 500 -s format jpeg -s formatOptions 60 "$thumb" >/dev/null

  echo "Processed $name -> $out ($(du -h "$out" | cut -f1)), $thumb ($(du -h "$thumb" | cut -f1))"
done
