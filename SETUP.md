# Pitchd — setup checklist

Everything is scaffolded and runs locally already (`npm run dev`). These are the external accounts/steps only you can do — I can't create third-party accounts or hold your secrets.

## 1. Supabase (database + auth) — ✅ done

Project created, `schema.sql` run, `.env` wired with the real URL/anon key.

## 2. Anthropic + Cloudflare Worker (local) — ✅ done

Anthropic key is in `worker/.dev.vars` (gitignored), worker running locally via `wrangler dev` at `http://127.0.0.1:8787`.

**Still needed for a real deploy** (not required for local testing):
1. `wrangler login` — needs a free Cloudflare account.
2. From `pitchd/worker/`, set secrets for production:
   ```
   wrangler secret put ANTHROPIC_API_KEY
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   wrangler secret put RESEND_API_KEY
   ```
3. `wrangler deploy` from `pitchd/worker/`.

## 3. Google OAuth (for "Continue with Google")

1. In [Google Cloud Console](https://console.cloud.google.com), create an OAuth 2.0 Client ID (Web application).
2. Authorized redirect URI: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`.
3. In Supabase: Authentication → Providers → Google — paste the Client ID and Secret, enable it.
4. Add your local + deployed origins (`http://localhost:5173`, your Cloudflare Pages URL) under Authentication → URL Configuration → Redirect URLs.

## 4. LinkedIn OAuth (for "Continue with LinkedIn")

LinkedIn only exposes basic sign-in identity (name, email, photo) to third-party apps now — not profile/work history, so this is a login option only, not an import.

1. Create an app at [LinkedIn Developers](https://www.linkedin.com/developers/apps), under your own LinkedIn Company Page (LinkedIn requires this even for personal projects — any page works).
2. In the app's **Products** tab, request **"Sign In with LinkedIn using OpenID Connect"** (usually auto-approved).
3. In the app's **Auth** tab, add the redirect URL: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`.
4. Copy the **Client ID** and **Client Secret**.
5. In Supabase: Authentication → Providers → LinkedIn (OIDC) — paste them in, enable it.

## 5. Resend (reminder emails)

1. Create an account at [resend.com](https://resend.com), verify a sending domain (or use their test domain while developing).
2. That's the `RESEND_API_KEY` from step 2. Update `REMINDER_FROM_EMAIL` in `wrangler.toml` to an address on your verified domain.

## 6. Deploy the frontend (Cloudflare Pages)

1. Push this repo to GitHub (or connect Cloudflare Pages directly to a local build).
2. In Cloudflare Pages: framework preset **Vite**, build command `npm run build`, output directory `dist`.
3. Add environment variables in the Pages project settings: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WORKER_URL` (your deployed worker's URL, e.g. `https://pitchd-worker.<you>.workers.dev`).

## Once wired up

- Sign up locally at `http://localhost:5173/signup`, confirm your email, then you'll land in Onboarding — completing it is required before Dashboard/Applications/Apply become reachable.
- The reminder cron runs daily at 07:00 UTC (`worker/wrangler.toml`) — adjust the schedule there if you'd rather it run at a different time.
