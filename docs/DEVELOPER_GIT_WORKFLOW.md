# Git workflow for prototype work

Repository: **https://github.com/mtnsdev/prototype**

Use this flow so everyone branches from an up-to-date `main` and ships work via pull requests.

---

## Standard flow (clone prototype only)

If you work **only** in the prototype repo, `origin` points at GitHub:

```bash
git clone https://github.com/mtnsdev/prototype.git
cd prototype

git checkout main
git pull origin main

git checkout -b feat/your-topic-name
# develop…

git add -A
git commit -m "feat: short description of the change"
git push -u origin feat/your-topic-name
```

Then open a **Pull Request** on GitHub: `feat/your-topic-name` → `main`.

---

## Flow from the Enable `enable-app-v2` clone (two remotes)

Some teams keep the app under `enable-app-v2` with a second remote named **`prototype`**:

```bash
cd enable-app-v2

git fetch prototype
git checkout main
git pull prototype main

git checkout -b feat/your-topic-name
# develop…

git push -u prototype feat/your-topic-name
```

Open the PR on **mtnsdev/prototype** (not `enable-app-v2`).

| Step        | Prototype-only clone | `enable-app-v2` + `prototype` remote |
|------------|----------------------|--------------------------------------|
| Update base | `git pull origin main` | `git pull prototype main`           |
| Publish     | `git push -u origin <branch>` | `git push -u prototype <branch>` |

---

## Optional: branch from a feature line

To continue work that matches the current prototype feature branch (e.g. `feat/prototype-from-updated-main`) instead of `main`:

```bash
git fetch origin   # or: git fetch prototype
git checkout feat/prototype-from-updated-main
git pull origin feat/prototype-from-updated-main   # or: git pull prototype …

git checkout -b feat/your-topic-name
```

Only use this when the team agrees the PR should stack on that branch.

---

## Checklist before opening a PR

- [ ] Branch is up to date with the agreed base (`main` or team branch).
- [ ] Commits have clear messages.
- [ ] PR targets the correct repo: **https://github.com/mtnsdev/prototype**
