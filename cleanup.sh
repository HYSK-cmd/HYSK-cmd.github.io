#!/usr/bin/env bash
# Tidies this repository down to the static site.
#
# Nothing is destroyed: everything the site no longer uses is MOVED to
#   ~/Desktop/Portfolio-archive/
# so you can delete that folder yourself once you are sure you don't want it.
#
# Run from the repository root:   bash cleanup.sh

set -euo pipefail
cd "$(dirname "$0")"

ARCHIVE="$HOME/Desktop/Portfolio-archive"
mkdir -p "$ARCHIVE"

keep() { [ -e "$1" ]; }
stash() {
  if keep "$1"; then
    mkdir -p "$ARCHIVE/$(dirname "$1")"
    mv "$1" "$ARCHIVE/$1"
    echo "  archived  $1"
  fi
}
scrub() {
  if keep "$1"; then
    rm -rf "$1"
    echo "  removed   $1"
  fi
}

echo "Archiving the React/Vite app ->  $ARCHIVE"
stash src
stash public
stash video
stash components.json
stash package.json
stash package-lock.json
stash postcss.config.js
stash tailwind.config.js
stash tsconfig.json
stash vite.config.ts
stash deploy.yml
stash REFACTOR-PLAN.md

echo "Removing disposable files"
scrub node_modules
scrub .venv
find . -name '.DS_Store' -not -path './.git/*' -delete 2>/dev/null || true
echo "  removed   .DS_Store files"

# the flat copies from the previous pass now live under assets/
for f in selfie.jpg hoon-yang-resume.pdf aerolance-research.pdf spider-bot.pdf; do
  scrub "$f"
done

echo
echo "Done. What is left:"
find . -not -path './.git/*' -not -name '.' | sort | sed 's|^\./|  |'
echo
echo "Next:"
echo "  git add -A"
echo "  git commit -m 'Rebuild site as a single static page; archive the Vite app'"
echo "  git push"
