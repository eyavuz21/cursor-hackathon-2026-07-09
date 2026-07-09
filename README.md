# Wander — Interest Travel Guide

Hackathon project for the 2026 July 09 Cursor Hackathon. A travel guide that recommends nearby places based on how far you like to walk and your interests (history, food).

Built with **Next.js 16** (App Router), **TypeScript**, **Tailwind CSS**, and **Supabase**.

## Live app

**Production:** [https://cursor-hackathon-2026-07-09.vercel.app](https://cursor-hackathon-2026-07-09.vercel.app)

**Vercel dashboard:** [vercel.com/boyle/cursor-hackathon-2026-07-09](https://vercel.com/boyle/cursor-hackathon-2026-07-09)

## Getting started

```bash
npm install
cp .env.example .env.local   # add Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase setup

1. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor
2. Enable **Anonymous sign-ins** (Authentication → Providers → Anonymous)
3. Add env vars to `.env.local` **and** the [Vercel project settings](https://vercel.com/boyle/cursor-hackathon-2026-07-09/settings/environment-variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

See [`PLAN.md`](PLAN.md) for the full build plan (Person A / Person B split).

## Deployments

- **Production** deploys from `main` → [cursor-hackathon-2026-07-09.vercel.app](https://cursor-hackathon-2026-07-09.vercel.app)
- **Preview** deployments are created automatically for every branch and pull request
