# Wander — Human-first urban mobility

**Live app:** [cursor-hackathon-2026-07-09.vercel.app](https://cursor-hackathon-2026-07-09.vercel.app)

Built for the **2026 July 09 Cursor Hackathon**. Wander is not another map that optimises for the machine. It optimises for the human walking through the city.

Modern navigation apps are built for efficiency — the absolute shortest time. That often means routing people down noisy, high-traffic, concrete-heavy corridors. It increases daily stress and disconnects people from the places they pass through.

Wander shifts the focus from **efficiency to experience**. It turns dead commute time into something you can reclaim for mental health, community wealth, and physical vitality.

---

## Why now?

Cities are louder, faster, and lonelier than they were a decade ago. People still have to move through them every day — to work, to meet friends, to run errands — but the tools they use treat that movement as a problem to minimise, not a life to live.

Wander answers a simple question: *what if your route cared about how you feel, who you meet, and how you move — not just how fast you arrive?*

---

## Three journey modes

### 1. MentalClear (Mindfulness)

**The antidote to "hurry sickness".**

Chronic overstimulation and anxiety are defining features of modern urban life. Concrete corridors, traffic noise, and visual clutter create constant micro-stressors — especially on commutes you cannot avoid.

MentalClear intentionally biases routes toward calmer paths: quieter streets, greener coverage, libraries, historic sites, and low-stress walking distances. It is passive eco-therapy built into a daily chore.

**In the app:** choose **Mindfulness** during onboarding, set your walking pace, and Explore surfaces calmer nearby picks within a comfortable radius.

### 2. SocialExplore (Social)

**Combating the isolation epidemic.**

Post-pandemic cities struggle with social cohesion. Foot traffic on local high streets has hollowed out while digital commerce concentrates spending away from independent businesses.

SocialExplore routes you past thriving local spots — cafés, markets, bookshops, bars, and independent retail — so discovery is part of the journey, not a separate trip. You get a richer walk; local economies get more eyes on the street.

**In the app:** choose **Social**, pick vibes (Food / Shops / Drinks), and recommendations lean into meet-up friendly, discovery-oriented places.

### 3. HealthOptimised

**Fighting sedentary lifestyles through preventative movement.**

Most people cannot find gym time, but they still travel. HealthOptimised turns a static A-to-B walk into a dynamic health route — extra steps and stops woven in while respecting a time budget (~45 min or ~1 hour).

**In the app:** choose **Health-optimised**, set your time budget, and the journal planner builds a walking route with added movement without a manual toggle.

---

## Spatial shopping planner (ParkAndSave integration)

Errands are another form of urban mobility that default maps treat as pure efficiency. Wander adds a **spatial shopping planner** inspired by [ParkAndSave](https://github.com/eyavuz21/ParkAndSave) and [SpatialCart](https://spatialcart.up.railway.app/) — merging "where do I shop?" with "how do I get there?".

| Mode | What it optimises for |
|------|------------------------|
| **Scavenger** | Nearest stop per item along your route — hunt deals across multiple shops without a big detour |
| **Efficiency** | One supermarket that covers your whole list — minimise stops when you are in a rush |

**How it works today (MVP):**

1. Type or paste your shopping list on [`/shop`](https://cursor-hackathon-2026-07-09.vercel.app/shop)
2. Optionally set a destination (or plan from your current location)
3. Wander finds real nearby supermarkets via **OpenStreetMap** (same data layer as ParkAndSave)
4. The planner orders stops along your walking corridor

**ParkAndSave roadmap:** the full [ParkAndSave](https://github.com/eyavuz21/ParkAndSave) stack adds live web price intelligence (LinkUp), parking search, and agent-authored UI (CopilotKit + A2UI). Wander's MVP proves the routing layer; ParkAndSave proves the price layer — together they become a complete errand copilot.

---

## What you can do in the app

| Page | Purpose |
|------|---------|
| [`/onboarding`](https://cursor-hackathon-2026-07-09.vercel.app/onboarding) | Mode-first setup: pick MentalClear, SocialExplore, or HealthOptimised → one follow-up question → launch |
| [`/explore`](https://cursor-hackathon-2026-07-09.vercel.app/explore) | Map + recommendations from your location; toggle journey mode live |
| [`/plan`](https://cursor-hackathon-2026-07-09.vercel.app/plan) | Build a walking journal route through Explore picks to a destination |
| [`/shop`](https://cursor-hackathon-2026-07-09.vercel.app/shop) | Spatial shopping planner — Scavenger or Efficiency mode |

---

## Hackathon pitch framing

> **Don't pitch "a map with filters."** Pitch a tool that humanises urban transit.
>
> Wander reclaims the dead time spent moving through cities for **mental health** (MentalClear), **community wealth** (SocialExplore), and **physical vitality** (HealthOptimised) — with a spatial errand layer (ParkAndSave) that makes shopping part of the journey instead of a separate optimisation problem.

**Why judges should care:** the product sits at the intersection of urban mobility, mental well-being, and local economic resilience — three problems that got worse after the pandemic and are still unsolved by incumbents optimising for ETA alone.

---

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS 4**
- **Supabase** — anonymous auth + `user_preferences`
- **Google Places API (New)** — recommendations, geocoding, walking directions
- **OpenStreetMap / Overpass** — supermarket discovery for the shopping planner (ParkAndSave pattern)

---

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Add to `.env.local` and [Vercel project settings](https://vercel.com/boyle/cursor-hackathon-2026-07-09/settings/environment-variables):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `GOOGLE_MAPS_API_KEY` | Server-side Places + Directions |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client-side Maps JS |

### Supabase setup

1. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL Editor
2. Enable **Anonymous sign-ins** (Authentication → Providers → Anonymous)

See [`PLAN.md`](PLAN.md) for the original hackathon build plan.

---

## Deployments

- **Production** — `main` → [cursor-hackathon-2026-07-09.vercel.app](https://cursor-hackathon-2026-07-09.vercel.app)
- **Preview** — automatic for every branch and pull request

---

## Related projects

- [ParkAndSave](https://github.com/eyavuz21/ParkAndSave) — agentic errand copilot (parking + supermarket routing, live web prices)
- [SpatialCart](https://spatialcart.up.railway.app/) — cheapest multi-store shopping routes
