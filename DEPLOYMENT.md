# InterviewAI — Deployment Guide

## ⚠️ Do this first: rotate your secrets

Your uploaded project had two real credentials committed to `backend/.env`,
and that file is tracked in git history:

- `GEMINI_API_KEY` (Google Gemini)
- `VITE_GOOGLE_CLIENT_ID` was also present in the root `.env` (less sensitive,
  but still shouldn't be public)

**Treat the Gemini key as compromised and rotate it** in Google AI Studio /
Google Cloud Console, then put the new value only in environment variables
(never in a committed file). I removed `backend/.env` from git tracking and
tightened `.gitignore`, but the old key is still visible in your git
history unless you rewrite it (e.g. `git filter-repo` or BFG Repo-Cleaner) or
simply start the GitHub repo fresh from this cleaned copy.

---

## What changed, and why

### Frontend redesign
- **`src/index.css`** is now the single stylesheet (replaces `styles.css` +
  empty `App.css`/old `index.css`). It defines a real design system: color
  tokens, spacing/radius scale, shadows, a brand gradient, Inter typeface,
  and dark/light theme variables — then restyles every existing class
  (`.navbar`, `.card`, `.mode-card`, `.stat-card`, buttons, forms, chips,
  modals, progress bars, etc.) on top of it. Because component class names
  didn't change, **no page's markup logic had to change** to pick up the
  new look.
- Removed duplicate/conflicting rules that existed 2–3 times over (e.g.
  `.navbar`, `.mode-card`, `.stat-card`, `.hero-subtitle` were each defined
  more than once with different values).
- Added focus-visible outlines, skip-friendly semantics, and
  `prefers-reduced-motion` support for accessibility.
- Added a responsive navbar with a real mobile hamburger menu
  (`src/components/Navbar.jsx`), active-link highlighting via `NavLink`,
  and `aria-label`/`aria-expanded` attributes.
- Added a `fade-in` entrance animation applied to every page's root
  container, plus shimmer skeleton/spinner styles for loading states
  (the existing spinners now live in the shared design system instead of
  being redefined ad hoc).
- Removed dead code: unused `InterviewCard.jsx` (not imported anywhere),
  unused images (`hero.png`, `react.svg`, `vite.svg`), and an unused
  `public/icons.svg`.
- Fixed a real bug in `Interview.jsx`: hooks were being called
  conditionally (after an early `return`), which violates the Rules of
  Hooks and can crash the page with "Rendered fewer hooks than expected."
  All hooks now run unconditionally; the "No Interview Data Found" guard
  runs after them.
- Removed leftover `console.log` debug statements.

### API calls, decoupled from `localhost`
Every page called `axios` directly against a hardcoded
`http://127.0.0.1:5000/...` URL (19 call sites across 12 files) — this
would have silently broken in any deployed environment. All calls now go
through **`src/api/client.js`**, a single axios instance whose base URL
comes from `VITE_API_URL` (an env var), and which automatically attaches
the saved JWT as an `Authorization` header. Pages now call `api.get("/x")`
instead of `axios.get("http://127.0.0.1:5000/x")`.

### Backend, made deployment-ready
- `SECRET_KEY` is now read from `os.getenv("SECRET_KEY", ...)` instead of
  being a hardcoded string — set a real random value in production.
- CORS now respects an `ALLOWED_ORIGINS` env var (comma-separated) instead
  of allowing every origin by default once you set it.
- The database URI respects `DATABASE_URL` if set, falling back to the
  local SQLite file otherwise (see note below on why you likely want
  Postgres in production).
- The Google OAuth client ID used to verify `/google-login` tokens was
  hardcoded in `app.py`; it now reads `GOOGLE_CLIENT_ID` from the
  environment (must match `VITE_GOOGLE_CLIENT_ID` on the frontend).
- `app.run()` now binds to `0.0.0.0` and `PORT` (Render sets `PORT`
  automatically) and debug mode defaults to off, controlled by
  `FLASK_DEBUG`.
- `db.create_all()` now runs at import time (not only inside
  `if __name__ == "__main__"`), so tables get created when gunicorn imports
  the app in production too.
- `requirements.txt` was saved as UTF-16 with no trailing newline (Windows
  artifact) — re-saved as plain UTF-8, de-duplicated, and `gunicorn` was
  added for production serving.
- Added `backend/Procfile` (`web: gunicorn app:app`) and a `render.yaml`
  Blueprint so you can deploy with one click via "New + → Blueprint".

### New config files
- **`vercel.json`** — SPA rewrite so client-side routes (e.g. `/dashboard`)
  don't 404 on refresh.
- **`.env.example`** (frontend) and **`backend/.env.example`** — documented
  templates for every environment variable the app needs.
- **`.gitignore`** — now ignores all `.env*` files (except `.env.example`),
  and the actual virtual-env folder name used in this project (`.venv-1/`,
  which wasn't covered before — only `.venv/` was).

---

## Environment variables reference

**Frontend (Vercel → Project → Settings → Environment Variables):**
| Variable | Example |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | `xxxxxxxx.apps.googleusercontent.com` |
| `VITE_API_URL` | `https://interview-ai-backend.onrender.com` |

**Backend (Render → Service → Environment):**
| Variable | Example |
|---|---|
| `GEMINI_API_KEY` | *(your rotated key)* |
| `GOOGLE_CLIENT_ID` | same value as `VITE_GOOGLE_CLIENT_ID` |
| `SECRET_KEY` | a long random string (`python -c "import secrets; print(secrets.token_hex(32))"`) |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` |
| `DATABASE_URL` | *(optional, see below)* |
| `FLASK_DEBUG` | `false` |

---

## Deployment checklist

### Backend → Render
1. Push this repo to GitHub/GitLab (make sure `backend/.env` is **not**
   included — it's now gitignored).
2. In Render: **New + → Blueprint**, point it at the repo — `render.yaml`
   will configure the service automatically. Or manually: **New + → Web
   Service**, root directory `backend`, build command
   `pip install -r requirements.txt`, start command `gunicorn app:app`.
3. Set the environment variables listed above in the Render dashboard.
4. **About the database**: Render's filesystem is ephemeral on the free
   tier — your SQLite file (`users.db`) will be wiped on every redeploy or
   restart. For anything beyond a demo, add a Render Postgres instance and
   set `DATABASE_URL` to its connection string; `Flask-SQLAlchemy` will use
   it automatically since the URI is already environment-driven.
5. Deploy, then note the resulting URL (e.g.
   `https://interview-ai-backend.onrender.com`).

### Frontend → Vercel
1. Import the repo in Vercel. Framework preset: **Vite**.
2. Build command `npm run build`, output directory `dist` (already set in
   `vercel.json`).
3. Set `VITE_GOOGLE_CLIENT_ID` and `VITE_API_URL` (pointing at your Render
   URL from above) in Vercel's Environment Variables.
4. Deploy.
5. Back in Render, set `ALLOWED_ORIGINS` to your new Vercel URL and
   redeploy the backend so CORS allows it.

### Google OAuth
Add both your Vercel domain and `http://localhost:5173` as **Authorized
JavaScript origins** in the Google Cloud Console credential used for
`VITE_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_ID`.

### Before/after going live
- [ ] Rotated `GEMINI_API_KEY`
- [ ] Confirmed `backend/.env` and root `.env` are **not** in git
- [ ] Set all env vars in Render + Vercel
- [ ] Verified `/register`, `/login`, `/google-login` work against the
      deployed backend URL
- [ ] Verified `ALLOWED_ORIGINS` includes your real Vercel domain
- [ ] Considered Postgres if you need data to persist across deploys

---

## Known pre-existing issues not touched in this pass

These existed before the redesign and are lower risk (don't crash the
app), so they were left alone to keep the diff focused on the requested
redesign/deployment work — flagging them for a follow-up:
- `Interview.jsx` / `Report.jsx` have a few `react-hooks/exhaustive-deps`
  and "setState called directly inside an effect" lint warnings from
  React's newer, stricter hooks linter. Functional, but worth a cleanup
  pass.
- `Login.jsx` assigns `googleUser` but never uses it (dead variable).
- `Report.jsx` assigns to `recommendation` without using the result
  afterward (dead code — worth a look in case a feature is missing display
  logic).
- The local dev `node_modules` in your uploaded zip contained native
  bindings for a different OS/architecture than this build environment,
  so I could not run a full `vite build` here — I verified everything with
  ESLint and manual review instead. Run `npm install` fresh in your own
  environment before your first local `npm run build`.
