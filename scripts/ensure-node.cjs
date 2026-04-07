#!/usr/bin/env node
/**
 * Fail fast on Node versions that break this stack (e.g. Next 16 + Node 24).
 * Invoked from npm preinstall / predev / prebuild.
 */
const major = parseInt(process.version.slice(1).split(".")[0], 10);

const MIN = 20;
const MAX = 23; // 24+ has seen ERR_INVALID_PACKAGE_CONFIG with Next 16.x

if (major >= MIN && major <= MAX) {
  process.exit(0);
}

const brewPrefix =
  process.platform === "darwin"
    ? `Run: brew install node@20 && export PATH="$(brew --prefix node@20)/bin:$PATH"`
    : "Install Node 20 LTS from https://nodejs.org/";

console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  Wrong Node.js version for this project                            ║
╚══════════════════════════════════════════════════════════════════╝
  Current: ${process.version} (need ${MIN}.x – ${MAX}.x)

  ${brewPrefix}

  Then from the project folder:
    rm -rf node_modules .next && npm install
    npm run dev

  Optional version managers (pick one):
    • fnm:  brew install fnm && fnm install 20 && fnm use 20
    • nvm:  https://github.com/nvm-sh/nvm#installing-and-updating
`);
process.exit(1);
