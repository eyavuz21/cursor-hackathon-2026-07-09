# Wander — Human-first urban mobility

**Live app:** [wander-hackathon.vercel.app](https://wander-hackathon.vercel.app)

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

**In the app:** choose **Mindfulness** during onboarding, set your walking pace, and the journey planner surfaces calmer nearby picks within a comfortable radius.

### 2. SocialExplore (Social)

**Combating the isolation epidemic.**

Post-pandemic cities struggle with social cohesion. Foot traffic on local high streets has hollowed out while digital commerce concentrates spending away from independent businesses.

SocialExplore routes you past thriving local spots — cafés, markets, bookshops, bars, and independent retail — so discovery is part of the journey, not a separate trip. You get a richer walk; local economies get more eyes on the street.

**In the app:** choose **Social**, pick vibes (Food / Shops / Drinks), and recommendations lean into meet-up friendly, discovery-oriented places.

### 3. HealthOptimised

**Fighting sedentary lifestyles through preventative movement.**

Most people cannot find gym time, but they still travel. HealthOptimised turns a static A-to-B walk into a dynamic health route — extra steps and stops woven in while respecting a time budget (~45 min or ~1 hour).

**In the app:** choose **Health-optimised**, set your time budget, and the journey planner builds a walking route with added movement without a manual toggle.

---

## Optional errands add-on

Errands are another form of urban mobility that default maps treat as pure efficiency. Wander folds shopping into your journey as an **optional add-on** — so groceries fit into your walk instead of becoming a separate trip.

| Mode | What it optimises for |
|------|------------------------|
| **Scavenger** | Cheapest stop per item along your route — hunt deals across multiple supermarkets without a big detour |
| **Efficiency** | One supermarket for your whole list — lowest total basket price when live data is available |

**How it works (inside `/journey`):**

1. Pick places on the map and optionally expand **Add errands**
2. Type or paste your shopping list
3. Wander finds real nearby supermarkets via **OpenStreetMap**, aligned to your journey destination
4. With `LINKUP_API_KEY` configured, **LinkUp** fetches live UK grocery prices from the web
5. The planner orders stops by cost:
   - **Scavenger** → cheapest shop per item along your corridor
   - **Efficiency** → single shop with the lowest estimated basket total

Without `LINKUP_API_KEY`, the planner still works but falls back to route-based supermarket matching (locations only, no £ prices).

---

## What you can do in the app

| Page | Purpose |
|------|---------|
| [`/onboarding`](https://wander-hackathon.vercel.app/onboarding) | Mode-first setup: pick MentalClear, SocialExplore, or HealthOptimised → one follow-up question → launch |
| [`/journey`](https://wander-hackathon.vercel.app/journey) | **One unified flow:** discover places on the map → optionally add errands → build your walking route → review and save |

Legacy URLs (`/explore`, `/plan`, `/shop`) redirect into `/journey` for backward compatibility.

---

## Hackathon pitch framing

> **Don't pitch "a map with filters."** Pitch a tool that humanises urban transit.
>
> Wander reclaims the dead time spent moving through cities for **mental health** (MentalClear), **community wealth** (SocialExplore), and **physical vitality** (HealthOptimised) — plus a spatial errand layer that weaves live-priced shopping into the route itself.

**Why judges should care:** the product sits at the intersection of urban mobility, mental well-being, and local economic resilience — three problems that got worse after the pandemic and are still unsolved by incumbents optimising for ETA alone.

---

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS 4**
- **Supabase** — anonymous auth + `user_preferences`
- **Google Places API (New)** — recommendations, geocoding, walking directions
- **OpenStreetMap / Overpass** — supermarket discovery for the shopping planner
- **LinkUp** — live web-sourced grocery prices for the optional errands add-on

---

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Add to `.env.local` and [Vercel project settings](https://vercel.com/boyle/wander-hackathon/settings/environment-variables):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `GOOGLE_MAPS_API_KEY` | Server-side Places + Directions |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client-side Maps JS |
| `LINKUP_API_KEY` | Live grocery prices for errands (optional — get one at [app.linkup.so](https://app.linkup.so)) |

### Supabase setup

1. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL Editor
2. Enable **Anonymous sign-ins** (Authentication → Providers → Anonymous)

See [`PLAN.md`](PLAN.md) for the original hackathon build plan.

---

## Deployments

- **Production** — `main` → [wander-hackathon.vercel.app](https://wander-hackathon.vercel.app)
- **Preview** — automatic for every branch and pull request
