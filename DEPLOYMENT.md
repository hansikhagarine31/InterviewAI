# Deployment Guide

InterviewAI runs as two pieces: a Flask API on **Render** (with a Render PostgreSQL database) and a static React app on **Vercel**. Deploy the backend first, because the frontend needs its URL at build time.

```
Vercel (React)  ──►  Render web service (Flask)  ──►  Render PostgreSQL
                              │
                              ├──►  Gemini API
                              └──►  Brevo API (OTP emails)
```

## Before you start

- A **Gemini API key** from https://aistudio.google.com/apikey
- A **Google OAuth client ID** (Google Cloud Console, APIs & Services, Credentials) if you want Google sign-in
- A **Brevo** account (https://app.brevo.com) if you want password reset by email
- Never commit `.env` files. `.gitignore` already excludes them. If a key is ever pasted somewhere public, rotate it.

## 1. Database (Render PostgreSQL)

Render's disk is ephemeral, so the default SQLite file is wiped on every restart or redeploy. Use Postgres for anything beyond a throwaway demo.

1. Render dashboard, **New + , PostgreSQL**. Choose the same region you will use for the web service.
2. When it is ready, copy the **Internal Database URL**.

The backend rewrites `postgres://` to `postgresql://` automatically, and tables are created on startup.

Note: Render's free Postgres instances expire after about 30 days. Upgrade the plan or export your data before then.

## 2. Backend (Render web service)

1. **New + , Blueprint**, pick this repository. `render.yaml` creates the `interview-ai-backend` service (root directory `backend`, build `pip install -r requirements.txt`, start `gunicorn app:app`). Or create a Web Service by hand with those same settings.
2. Set the environment variables:

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | your Gemini key |
| `SECRET_KEY` | a long random string (`python -c "import secrets; print(secrets.token_hex(32))"`). The Blueprint can generate one |
| `DATABASE_URL` | the Internal Database URL from step 1 |
| `GOOGLE_CLIENT_ID` | your OAuth client ID (same as the frontend) |
| `ALLOWED_ORIGINS` | your Vercel URL, set in step 4 |
| `BREVO_API_KEY` | Brevo v3 API key (starts with `xkeysib-`) |
| `MAIL_SENDER` | a sender address verified in Brevo |
| `FLASK_DEBUG` | `false` |

3. Deploy and note the service URL, for example `https://interview-ai-backend.onrender.com`.
4. Check it: opening `<url>/profile/1` should return `{"error":"Authentication required."}`. That means the app is up and protected.

## 3. Frontend (Vercel)

1. Import the repository in Vercel. Framework preset: **Vite**. `vercel.json` sets the build output and the rewrite that keeps client-side routes such as `/dashboard` from returning 404 on refresh.
2. Set environment variables for **Production**:

| Variable | Value |
|---|---|
| `VITE_API_URL` | the Render URL, with no trailing slash |
| `VITE_GOOGLE_CLIENT_ID` | the same client ID as the backend |

3. Deploy and note the production URL.

Vite bakes these values in at build time, so change them and redeploy rather than editing the running site.

CLI note: `vercel` run from the repository root detects `backend/` and `render.yaml` as a service and refuses to combine them with `vercel.json`. Either import through the Vercel dashboard, or deploy from a folder that contains only the frontend files (`src`, `public`, `index.html`, `package*.json`, `vite.config.js`, `vercel.json`).

## 4. Connect the two

1. On Render, set `ALLOWED_ORIGINS` to the exact Vercel URL (no trailing slash, no path) and let the service redeploy. Several origins can be comma-separated.
2. In Google Cloud Console, open the OAuth client and add the Vercel URL under **Authorized JavaScript origins** (and `http://localhost:5173` for local development). Changes can take a few minutes to apply.

## 5. Password-reset emails (Brevo)

1. Brevo, **SMTP & API , API Keys**: create a key and set it as `BREVO_API_KEY`.
2. **Senders, Domains & Dedicated IPs , Senders**: add and verify the address you will send from, and set it as `MAIL_SENDER`. Brevo rejects unverified senders.
3. **Security , Authorized IPs**: leave IP restriction off. Render's outgoing IPs change, so a restriction produces `401 Unauthorized`.
4. Deliverability: a free Gmail address as the sender often lands in spam. For real users, send from a domain you own and add the DKIM and DMARC records Brevo shows you.

## Checklist after deploying

- [ ] Register and log in on the live site
- [ ] Start a General interview and finish it; the report appears and the interview shows in History
- [ ] Upload a PDF resume and get questions
- [ ] Forgot password: the email arrives and the reset works
- [ ] Google sign-in works (authorized origin added)
- [ ] Restart the backend from the Render dashboard, then confirm your account and history are still there (proves Postgres is in use)

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Every request fails in the browser with a CORS error | `ALLOWED_ORIGINS` does not exactly match the frontend URL (check the scheme and trailing slash) |
| First request is very slow | Free-tier backend waking up (30-60 seconds). Later requests are fast |
| Login works, then you are sent back to the login page | The token expired, or `SECRET_KEY` changed. Log in again |
| Users and history disappear after a restart | `DATABASE_URL` is not set, so the app is on SQLite |
| Startup error mentioning `psycopg2` or `postgres` dialect | Use `postgresql://...` and make sure `psycopg2-binary` is in `requirements.txt` |
| "Could not send the OTP email" | Check `BREVO_API_KEY`, that `MAIL_SENDER` is verified, and Authorized IPs. The real error is in the Render logs (`OTP email failed`) |
| Google button says the origin is not allowed | The frontend URL is missing from the OAuth client's authorized origins |
| Questions or evaluation return a 500 | Missing or invalid `GEMINI_API_KEY`, or the Gemini quota is exhausted |
| Google sign-in warns "client ID not found" in the console | `VITE_GOOGLE_CLIENT_ID` is not set on Vercel (redeploy after setting it) |
