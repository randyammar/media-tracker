# Collectify

A full-stack Next.js app for tracking movies, music, and games with:

- Media CRUD (add/edit/delete)
- Status tracking (`owned`, `wishlist`, `currently_using`, `completed`)
- Search/filter by title, creator, genre, status, and media type
- Secure share links (collection or single item)
- AI metadata enrichment for **Music**
- Insights dashboard (status, genre, release timeline)
- Responsive UI built with shadcn/ui

## Important Product Rule

- Music does **not** use external metadata API lookup.
- Music **does** use Gemini Assist Tools to generate data from title and existing item fields.

This is enforced in both UI and backend endpoints.

## Tech Stack

- Next.js (App Router, TypeScript)
- Tailwind + shadcn/ui
- Supabase Auth + Postgres + RLS
- Gemini API (AI)
- TMDB + RAWG (metadata for movie/game)
- Netlify (deployment target)

## Project Structure

```text
app/
  api/                   # Route handlers
  app/                   # Authenticated app routes
  auth/                  # Sign-in/sign-up pages
  share/[token]/         # Public share link view
components/
  auth/
  insights/
  layout/
  media/
lib/
  ai/
  metadata/
  supabase/
supabase/migrations/
  202602270001_init.sql
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file and fill values:

```bash
cp .env.example .env.local
```

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `TMDB_API_KEY`
- `RAWG_API_KEY`

3. Apply database schema:

- Open Supabase SQL Editor.
- Run `supabase/migrations/202602270001_init.sql`.
- Run `supabase/migrations/202602270002_share_links_persistent.sql`.

4. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Auth and Sharing

- Users sign up/sign in via Supabase Auth (email/password).
- Data is protected by row-level security.
- Sharing is on-demand only:
  - collection share link
  - single-item share link
- Share links are unlisted tokens and can be revoked.

## AI Features

- `POST /api/ai/enrich`:
  - Enriches a Music item (genres/tags/summary/release date/rating/cover image URL)
  - For Music, enrichment is generated from title and existing item data

## Scripts

- `npm run dev` - run development server
- `npm run lint` - lint code
- `npm run build` - production build
- `npm run start` - run production server

## Deploy to Netlify

1. Push repo to GitHub/GitLab/Bitbucket.
2. Import project in Netlify.
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Add all env vars from `.env.example` in Netlify Site Settings.
5. Ensure Supabase schema migration has been applied.
6. Deploy.

After deployment, your live URL will be the Netlify production URL, e.g.:

`https://your-project-name.netlify.app`

## Notes

- Next.js 16 currently warns that `middleware.ts` is deprecated in favor of `proxy.ts`.
- The app still works correctly; migration to `proxy.ts` can be done in a follow-up refactor.
