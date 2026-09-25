#!/usr/bin/env bash
# Verifies scripts/process-images.sh produces correctly-sized, small output files.
set -euo pipefail

TMP_SRC="$(mktemp -d)"
TMP_DEST="$(mktemp -d)"
trap 'rm -rf "$TMP_SRC" "$TMP_DEST"' EXIT

cp tests/fixtures/sample-source.jpg "$TMP_SRC/sample-source.jpg"

./scripts/process-images.sh "$TMP_SRC" "$TMP_DEST" "sample-source.jpg"

full="$TMP_DEST/sample-source.jpg"
thumb="$TMP_DEST/thumbs/sample-source.jpg"

[ -f "$full" ] || { echo "FAIL: missing $full"; exit 1; }
[ -f "$thumb" ] || { echo "FAIL: missing $thumb"; exit 1; }

full_width="$(sips -g pixelWidth "$full" | awk '/pixelWidth/{print $2}')"
[ "$full_width" -le 1400 ] || { echo "FAIL: $full is wider than 1400px ($full_width)"; exit 1; }

full_size_kb="$(du -k "$full" | cut -f1)"
[ "$full_size_kb" -le 500 ] || { echo "FAIL: $full is larger than 500KB (${full_size_kb}KB)"; exit 1; }

thumb_width="$(sips -g pixelWidth "$thumb" | awk '/pixelWidth/{print $2}')"
[ "$thumb_width" -le 500 ] || { echo "FAIL: $thumb is wider than 500px ($thumb_width)"; exit 1; }

echo "PASS: process-images.sh produces correctly sized output"
