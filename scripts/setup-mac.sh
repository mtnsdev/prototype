#!/usr/bin/env bash
# One-shot setup for macOS: correct Node on PATH, clean install, start dev.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== Enable prototype — setup (macOS) =="
echo "Project: $ROOT"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "Node is not installed or not on PATH."
  if command -v brew >/dev/null 2>&1; then
    echo "Installing Node 20 via Homebrew…"
    brew install node@20
    export PATH="$(brew --prefix node@20)/bin:$PATH"
  else
    echo "Install Homebrew from https://brew.sh then re-run this script,"
    echo "or install Node 20 LTS from https://nodejs.org/"
    exit 1
  fi
fi

# Prefer Homebrew node@20 if the keg is actually installed (brew --prefix can lie before install).
if command -v brew >/dev/null 2>&1; then
  PREFIX="$(brew --prefix node@20 2>/dev/null || true)"
  if [[ -n "${PREFIX}" && -f "${PREFIX}/bin/node" ]]; then
    export PATH="${PREFIX}/bin:$PATH"
    echo "Using Homebrew Node: ${PREFIX}/bin/node ($("${PREFIX}/bin/node" -v))"
  elif command -v brew >/dev/null 2>&1; then
    echo "Installing node@20 via Homebrew (keg-only; keeps your default node elsewhere)…"
    brew install node@20
    PREFIX="$(brew --prefix node@20)"
    export PATH="${PREFIX}/bin:$PATH"
    echo "Using Homebrew Node: ${PREFIX}/bin/node ($("${PREFIX}/bin/node" -v))"
  fi
fi

echo "Node: $(command -v node) ($(node -v))"
if ! node scripts/ensure-node.cjs; then
  echo "Still the wrong Node after setup — add to ~/.zshrc, then open a new terminal:"
  echo "  export PATH=\"\$(brew --prefix node@20)/bin:\$PATH\""
  exit 1
fi

echo ""
echo "Clean install dependencies…"
rm -rf node_modules .next
npm install

echo ""
echo "Done."
echo "Start the app (keep this terminal open):"
echo "  npm run dev"
echo ""
echo "Then open: http://127.0.0.1:4002"
echo "Or run:    npm run open:dev"
