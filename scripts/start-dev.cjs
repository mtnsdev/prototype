#!/usr/bin/env node
/**
 * Local Next.js dev bootstrap — kills stale processes + lock, then starts dev.
 * Uses execFileSync (no shell) so paths with spaces (e.g. "Enable Local") work.
 *
 *   npm run dev         — Turbopack dev (Next 16 default)
 *   npm run dev:webpack — webpack dev (opt-in; use if you hit Turbopack issues)
 *   npm run dev:stop
 *   npm run dev:fresh   — after cleanup, delete entire .next then dev
 *   SKIP_DEV_CLEANUP=1  — skip killing ports / removing lock
 */
const { execFileSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
process.chdir(root);

const argv = process.argv.slice(2);
const stopOnly = argv.includes("--stop");
const fresh = argv.includes("--fresh");
const portArg = argv.find((a) => /^\d{2,5}$/.test(a));
const PORT = String(portArg || process.env.DEV_PORT || "4002");

const PORTS_TO_CLEAR = Array.from(new Set(["4001", "4002", PORT]));

/** PIDs from lsof via argv array (safe with spaces in paths). */
function lsofPids(args) {
  try {
    const out = execFileSync("lsof", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return [
      ...new Set(
        out
          .trim()
          .split(/\s+/)
          .filter((x) => /^\d+$/.test(x))
      ),
    ];
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    process.kill(Number(pid), "SIGKILL");
    return true;
  } catch {
    return false;
  }
}

function freeDevEnvironment() {
  const lockPath = path.join(root, ".next", "dev", "lock");

  if (fs.existsSync(lockPath)) {
    const pids = lsofPids(["-t", lockPath]);
    let n = 0;
    for (const pid of pids) {
      if (killPid(pid)) n += 1;
    }
    if (n) console.log(`[dev] Stopped ${n} process(es) holding .next/dev/lock`);
  }

  for (const p of PORTS_TO_CLEAR) {
    const pids = lsofPids(["-t", `-iTCP:${p}`, "-sTCP:LISTEN"]);
    let k = 0;
    for (const pid of pids) {
      if (killPid(pid)) k += 1;
    }
    if (k) console.log(`[dev] Freed port ${p} (${k} listener(s))`);
  }

  if (process.platform !== "win32") {
    try {
      execFileSync("sleep", ["1"], { stdio: "ignore" });
    } catch {
      /* ignore */
    }
  }

  try {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
      console.log("[dev] Removed .next/dev/lock");
    }
  } catch (e) {
    if (e.code !== "ENOENT") console.warn("[dev] Could not remove lock:", e.message);
  }
}

if (process.env.SKIP_DEV_CLEANUP !== "1") {
  freeDevEnvironment();
} else {
  console.log("[dev] SKIP_DEV_CLEANUP=1 — skipping port/lock cleanup\n");
}

if (fresh && !stopOnly) {
  console.log("[dev] Removing .next (clean build)…");
  fs.rmSync(path.join(root, ".next"), { recursive: true, force: true });
  console.log("[dev] .next removed.");
}

if (stopOnly) {
  console.log("[dev] Stop complete. Run `npm run dev` when ready.");
  process.exit(0);
}

const nextBin = path.join(root, "node_modules", ".bin", "next");
if (!fs.existsSync(nextBin)) {
  console.error("[dev] Run `npm install` first (missing node_modules/.bin/next).");
  process.exit(1);
}

/** Corrupted installs can leave `hot-reloader/pages` empty → "unable to load" / module-not-found in the browser. */
const nextHmrWebsocket = path.join(
  root,
  "node_modules",
  "next",
  "dist",
  "client",
  "dev",
  "hot-reloader",
  "pages",
  "websocket.js"
);
if (!fs.existsSync(nextHmrWebsocket)) {
  console.error(
    "[dev] Next.js install looks incomplete (missing dev HMR files).\n" +
      "    Fix: rm -rf node_modules/next && npm install\n" +
      "    Or full reset: rm -rf node_modules .next && npm install"
  );
  process.exit(1);
}

const reactVirtualPkg = path.join(
  root,
  "node_modules",
  "@tanstack",
  "react-virtual",
  "package.json"
);
if (!fs.existsSync(reactVirtualPkg)) {
  console.warn(
    "[dev] Missing @tanstack/react-virtual (declared in package.json). Running npm install…"
  );
  execFileSync("npm", ["install"], { stdio: "inherit", cwd: root });
  if (!fs.existsSync(reactVirtualPkg)) {
    console.error(
      "[dev] Still missing @tanstack/react-virtual after npm install. Try: rm -rf node_modules && npm install"
    );
    process.exit(1);
  }
}

const HOST = process.env.DEV_HOST;
const nextArgs = ["dev", "-p", PORT];
if (HOST) nextArgs.push("-H", HOST);
// Opt-in webpack dev (`DEV_WEBPACK=1`) if Turbopack misbehaves on your machine.
if (process.env.DEV_WEBPACK === "1") nextArgs.push("--webpack");

console.log(
  `[dev] Starting Next.js — open http://127.0.0.1:${PORT} (or http://localhost:${PORT})` +
    (HOST ? `  [bind: ${HOST}]` : "") +
    "\n"
);

// Use spawn (not spawnSync) so SIGINT/SIGTERM reach the Next process and ports unlock on exit.
const child = spawn(nextBin, nextArgs, {
  stdio: "inherit",
  cwd: root,
  env: { ...process.env },
});

function forwardSignal(sig) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  try {
    child.kill(sig);
  } catch {
    /* ignore */
  }
}

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

child.on("error", (err) => {
  console.error("[dev] Failed to start Next.js:", err.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal === "SIGINT" || signal === "SIGTERM") {
    process.exit(0);
  }
  process.exit(code === null ? 1 : code);
});
