#!/usr/bin/env node
/**
 * Local Next.js dev bootstrap — kills stale processes + lock, then starts dev.
 * Uses execFileSync (no shell) so paths with spaces (e.g. "Enable Local") work.
 *
 *   npm run dev
 *   npm run dev:stop
 *   npm run dev:fresh   — after cleanup, delete entire .next then dev
 */
const { execFileSync, spawnSync } = require("child_process");
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
      execFileSync("sleep", ["0.35"], { stdio: "ignore" });
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

freeDevEnvironment();

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
  `[dev] Starting Next.js on http://localhost:${PORT}` +
    (HOST ? ` (host ${HOST})` : "") +
    "\n"
);

const r = spawnSync(nextBin, nextArgs, {
  stdio: "inherit",
  cwd: root,
  env: { ...process.env },
});

process.exit(r.status === null ? 1 : r.status);
