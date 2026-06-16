# AGENTS.md

## Cursor Cloud specific instructions

PEAR™ Elite is a **frontend-only React 19 + Vite SPA** (no separate backend server). Supabase is the only backend dependency and is **optional**.

### Services
- **Web SPA (only service):** `npm run dev` → http://localhost:5173 (Vite). Build with `npm run build`, preview with `npm run preview`. There are no `lint` or `test` scripts defined in `package.json`.

### Demo mode vs. Supabase (important, non-obvious)
- `src/services/supabaseConfig.js` contains a **hardcoded fallback Supabase URL + anon key**. As a result, with no `.env` the app treats itself as "configured" and will attempt to talk to that external (possibly defunct) project, so the local demo accounts will NOT work.
- To run fully self-contained in **localStorage demo mode**, create a `.env` with placeholder values so `isConfigured` becomes false:
  ```
  VITE_SUPABASE_URL=your_url
  VITE_SUPABASE_ANON_KEY=your_anon_key
  ```
  (Any value starting with `your_` / empty is treated as a placeholder.) `.env` is gitignored, so this must be recreated per environment.
- Demo head-admin login (local mode only): `admin@pear.elite` / `PearElite2024!` (see `src/services/localAuth.js`).

### Gotchas
- In demo mode the auth session is held **in memory** (`localAuth.js`), so a full page reload / direct URL navigation logs you out. Navigate via the in-app nav links to keep the session.
- The announcement composer lives in the **Admin panel** (`/admin` → "განცხადებები" tab), not on the public `/announcements` page. UI text is in Georgian.
- For full cloud E2E (real auth, shared DB, storage, admin user creation via the `create-user`/`delete-user` edge functions), provision a Supabase project per `README.md`, set the two `VITE_` env vars, and apply `supabase/schema.sql`.
