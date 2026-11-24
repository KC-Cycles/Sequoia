#!/usr/bin/env bash
# Build the copy of Sequoia that is safe to publish: an allowlist of app files and nothing else.
# The log, the Strava snapshot, plans and notes never leave this machine. The script refuses to
# finish if anything that looks personal is found in the result.
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:?usage: export-public.sh <new or empty target dir>}"
mkdir -p "$out"
# An existing checkout of the public repository is refreshed in place: its tracked files are removed first.
if [ -d "$out/.git" ]; then git -C "$out" rm -rq --ignore-unmatch . ; fi
if [ -n "$(ls -A "$out" | grep -v '^\.git$' || true)" ]; then echo "target is not empty: $out" >&2; exit 1; fi
cd "$here"
tar --exclude='__pycache__' -cf - index.html manifest.webmanifest sw.js package.json css js icons art fonts tests \
  tools/run-e2e.sh tools/icon.py tools/export-public.sh | tar -xf - -C "$out"
# Stamp the build: a fingerprint of every app file, so the running app can tell when a newer one is published.
stamp="$(cd "$out" && find index.html sw.js manifest.webmanifest css js art fonts icons -type f ! -name version.js | LC_ALL=C sort | xargs sha256sum | sha256sum | cut -c1-12)"
sed -i "s/VERSION = '[^']*'/VERSION = '$stamp'/" "$out/js/version.js"
grep -q "VERSION = '$stamp'" "$out/js/version.js" || { echo "could not stamp the version" >&2; exit 1; }
printf '/data/\nnode_modules/\n.superpowers/\n__pycache__/\n' > "$out/.gitignore"
: > "$out/.nojekyll"
cat > "$out/README.md" <<'MD'
# Sequoia

A strength-training web app for a phone's home screen: guided sessions, per-set logging, a rest timer and a coaching engine that picks the next session.

The training log lives only in the browser's storage on the phone that uses the app. No log, account or activity data is stored in this repository.

Run the tests with `npm test` and `tools/run-e2e.sh`.
MD
# --- the check: no data files, no personal words, no addresses or session links
bad=0
if [ -e "$out/data" ] || [ -n "$(find "$out" \( -name 'seed.json' -o -name 'activity.json' -o -name '*-plan.json' -o \( -name '*.md' ! -name 'README.md' \) \) | head -1)" ]; then echo "personal data file in export" >&2; bad=1; fi
# Personal words to block are kept in a file that is never committed or exported.
words="${SEQUOIA_PRIVATE_WORDS:-$(cat "$here/.superpowers/private-words" 2>/dev/null || true)}"
if [ -z "$words" ]; then echo "no private word list found; refusing to export" >&2; bad=1; fi
if [ -n "$words" ] && grep -rnIiE "$words" "$out" --exclude-dir=.git; then echo "personal word in export" >&2; bad=1; fi
if grep -rnIE "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}|session_[0-9A-Za-z]{10,}|claude\.ai/" "$out" --exclude-dir=.git --exclude=export-public.sh; then echo "address or session link in export" >&2; bad=1; fi
if [ "$bad" != 0 ]; then if [ -d "$out/.git" ]; then git -C "$out" reset -q --hard HEAD && git -C "$out" clean -qfd; fi; exit 1; fi
echo "export ok: $(find "$out" -type f -not -path '*/.git/*' | wc -l) files"
