# Pocket — Expense Tracker

A local-first expense tracker PWA. Works fully offline out of the box; cloud sign-in and sync across devices are optional and activate automatically once configured.

## Tech stack

- **Frontend**: React + TypeScript, Vite, Tailwind CSS, `vite-plugin-pwa`
- **Local storage**: IndexedDB (via `idb`) — the source of truth on-device
- **Auth**: Firebase Authentication (phone number + SMS OTP)
- **Cloud database**: Supabase (Postgres + Row-Level Security), trusting Firebase JWTs via Supabase's Third-Party Auth integration
- **Hosting**: Railway (static build served via `serve`)

## Local development

```bash
npm install
npm run dev
```

The app runs fully offline-capable with no further setup — sign-in and cloud sync are simply hidden until the environment variables below are set.

Other scripts:

```bash
npm run build    # typecheck + production build
npm run preview  # preview the production build locally
npm run lint      # eslint
```

## Optional: enable cloud sign-in and sync

This needs a Supabase project and a Firebase project, linked together. Local-only mode works fine without any of this.

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy your Project URL and anon/publishable key from **Project Settings → API**.

### 2. Firebase project

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Get started → Sign-in method** → enable **Phone**.
3. **Authentication → Settings → SMS region policy** → allow the countries you need to send OTPs to.
4. Upgrade to the **Blaze (pay-as-you-go)** plan (required for both Phone Auth SMS and Cloud Functions — no monthly fee, you only pay per SMS/invocation).
5. Register a **Web app** under Project Settings → General → Your apps, and copy the `apiKey`, `authDomain`, and `projectId`.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in the values from steps 1–2:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```

### 4. Deploy the Cloud Function

Supabase only trusts a Firebase user's JWT once it carries a `role: authenticated` custom claim. A Cloud Function (`functions/index.js`) attaches that claim to every new user automatically.

```bash
npm install -g firebase-tools   # if you don't have it
firebase login

cp .firebaserc.example .firebaserc
# edit .firebaserc: set "default" to your Firebase project ID

cd functions
npm install
npm run deploy
```

### 5. Link Firebase to Supabase

In the Supabase dashboard: **Authentication → Sign In / Providers → Third-Party Auth → Add integration → Firebase**, and paste your Firebase Project ID.

### 6. Run the database schema

Open `supabase/schema.sql`, replace every `<firebase-project-id>` placeholder with your actual Firebase project ID, then run the whole file in the Supabase dashboard's **SQL Editor**. This creates the `expenses` table and its Row-Level Security policies.

### 7. Test locally

Phone auth's reCAPTCHA check does not work on `localhost` — that's a Firebase platform restriction, not a bug. For local testing, add a fake number in Firebase console → **Authentication → Sign-in method → Phone numbers for testing** (e.g. `+91 9999999999` with code `123456`) and use that to sign in during development.

## Deploying

The app is set up to deploy on [Railway](https://railway.app) via Nixpacks (see `railway.json`): it runs `npm run build`, then serves the static `dist/` folder with `serve`.

If cloud sync is enabled:

1. Add the same five `VITE_*` variables (from `.env.local`) to Railway's **Variables** tab. Vite bakes them in at build time, so they must be set *before* the build runs.
2. Add your Railway domain to Firebase console → **Authentication → Settings → Authorized domains**.
3. Trigger a deploy.
