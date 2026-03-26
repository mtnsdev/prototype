## Enable (Next.js app)

### Local development

Default dev URL: **http://localhost:4002** (or **http://127.0.0.1:4002**)

```bash
npm install
npm run dev
```

Keep this terminal **open** until you see **`✓ Ready`** — if you close it, the browser shows **connection refused**.

`npm run dev` uses **`lsof` via `execFileSync`** (no shell), so project paths **with spaces** (e.g. `Enable Local`) don’t break cleanup. It frees **4001** & **4002**, removes **`.next/dev/lock`**, then starts Next (default bind **0.0.0.0**).

**Still broken?** Run in order:

1. `npm run dev:stop`
2. `npm run dev:fresh` — deletes **`.next`**, then starts dev (fixes wedged Turbopack/lock)
3. If **TypeScript / “Failed to compile”** mentions duplicate `PageProps` or files like **`.next/types/routes.d 2.ts`**, macOS created duplicate build files. Delete them, then `npm run dev:fresh`:
   - `rm -rf ".next 2"` (if present)
   - `rm -f .next/types/*\ 2.ts .next/types/*\ 3.ts` (duplicate `routes.d 2.ts`, etc.)
4. If pages never finish loading (browser spins, terminal stuck on “Compiling …”), do a full reinstall: `rm -rf node_modules .next && npm install`, then `npm run dev` again (fixes a corrupted `next` install or **`node_modules/* 2`** duplicate folders from Finder).
5. Open **http://localhost:4002** — dashboard routes **redirect to `/login`** until you sign in (HTTP 307 is normal).

On macOS, after the server is up: **`npm run open:dev`**.

**Cursor / VS Code Remote / SSH:** the app runs on the **remote** machine; your laptop browser must use **port forwarding** (or open a browser **on the remote**). Local `localhost:4002` will refuse if nothing is forwarded.

| Script | Use case |
| ------ | -------- |
| `npm run dev` | Default — cleanup + dev on **4002** |
| `npm run dev:stop` | Free ports + lock, no start |
| `npm run dev:fresh` | Cleanup + **delete `.next`** + dev (last resort) |
| `npm run dev:4001` | Cleanup + dev on **4001** |
| `npm run dev:raw` | `next dev` only — no cleanup |
| `npm run open:dev` | macOS: open **http://localhost:4002** |
| `DEV_PORT=4003 npm run dev` | Custom port |
| `DEV_HOST=127.0.0.1 npm run dev` | Bind loopback only (optional) |

Requires **Node 20+** (20 or 22 LTS recommended).

### Signup (optional)

```bash
curl -i -X POST "http://localhost:4002/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"StrongPass123"}'
```

(Adjust host/port if you changed `DEV_PORT`.)

### What this boilerplate does NOT include (yet)

Refresh tokens · OAuth / social login · CSRF protection · Chat persistence · Streaming responses · Rate limiting
