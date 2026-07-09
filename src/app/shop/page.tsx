"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { formatDetour, type ShopPlan, type ShoppingMode } from "@/lib/shopping";
import { getPreferences } from "@/lib/preferences";
import type { UserPreferences } from "@/lib/types";

type Coordinates = {
  lat: number;
  lng: number;
};

const MODE_OPTIONS: {
  value: ShoppingMode;
  label: string;
  description: string;
}[] = [
  {
    value: "scavenger",
    label: "Scavenger",
    description:
      "Nearest stop per item along your route — hunt deals across multiple shops.",
  },
  {
    value: "efficiency",
    label: "Efficiency",
    description:
      "One supermarket for the whole list — minimise stops when you are in a rush.",
  },
];

export default function ShopPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [list, setList] = useState("milk\nbread\neggs\ncoffee");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [mode, setMode] = useState<ShoppingMode>("efficiency");
  const [plan, setPlan] = useState<ShopPlan | null>(null);
  const [priceNote, setPriceNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    return new Promise<Coordinates>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported in this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          reject(
            new Error(
              "Location access was denied. Enable location permissions and try again.",
            ),
          );
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const prefs = await getPreferences();
        if (!prefs) {
          router.replace("/onboarding");
          return;
        }

        setPreferences(prefs);
        setCoords(await requestLocation());
      } catch (initError) {
        setError(
          initError instanceof Error
            ? initError.message
            : "Could not prepare the shopping planner.",
        );
      } finally {
        setLoading(false);
      }
    }

    void init();
  }, [requestLocation, router]);

  async function handlePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!preferences || !coords) return;

    setPlanning(true);
    setError(null);
    setPlan(null);
    setPriceNote(null);

    try {
      const response = await fetch("/api/shop-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list,
          mode,
          startLat: coords.lat,
          startLng: coords.lng,
          destinationQuery: destinationQuery.trim() || undefined,
          healthGoal: preferences.healthGoal,
          details: preferences.details,
        }),
      });

      const data = (await response.json()) as {
        plan?: ShopPlan;
        priceNote?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not build your shopping route.");
      }

      setPlan(data.plan ?? null);
      setPriceNote(data.priceNote ?? null);

      if (data.plan?.stops.length === 0) {
        setError(
          "No supermarkets found along this route. Try a destination in a busier area or widen your walking radius in onboarding.",
        );
      }
    } catch (planError) {
      setError(
        planError instanceof Error
          ? planError.message
          : "Could not build your shopping route.",
      );
    } finally {
      setPlanning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background px-6 font-sans">
        <main className="flex flex-col items-center gap-3">
          <span className="inline-block h-2 w-2 animate-pulse bg-foreground" />
          <p className="text-sm uppercase tracking-wider text-muted">
            Preparing your shopping planner...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <AppHeader
        subtitle="Spatial shopping planner · ParkAndSave-inspired errand routing"
      />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-6">
        <section className="brand-card p-6">
          <div className="flex flex-col gap-2">
            <h1 className="brand-heading">Plan errands en route</h1>
            <p className="text-sm leading-relaxed text-muted">
              Type your shopping list and Wander finds real supermarkets along your
              walking corridor using OpenStreetMap. Scavenger mode spreads items
              across nearby stops; Efficiency mode picks one shop for the whole list.
            </p>
            <p className="text-xs text-muted">
              Photo scan coming soon. Live price intelligence integrates with{" "}
              <a
                href="https://github.com/eyavuz21/ParkAndSave"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-link"
              >
                ParkAndSave
              </a>
              .
            </p>
          </div>

          <form onSubmit={handlePlan} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="brand-label">Shopping list</span>
              <textarea
                value={list}
                onChange={(event) => setList(event.target.value)}
                rows={5}
                placeholder={"milk\nbread\neggs"}
                className="border border-border bg-accent-subtle px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="brand-label">Destination (optional)</span>
              <input
                type="text"
                value={destinationQuery}
                onChange={(event) => setDestinationQuery(event.target.value)}
                placeholder="e.g. Office, friend's flat, museum"
                className="border border-border bg-accent-subtle px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="brand-label">Planner mode</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {MODE_OPTIONS.map((option) => {
                  const selected = mode === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMode(option.value)}
                      className={`rounded-2xl border p-4 text-left transition-colors ${
                        selected
                          ? "border-highlight bg-highlight/10"
                          : "border-border bg-surface hover:border-muted"
                      }`}
                    >
                      <span className="font-medium text-foreground">
                        {option.label}
                      </span>
                      <p className="mt-1 text-sm text-muted">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={planning || !list.trim()}
              className="brand-button-primary"
            >
              {planning ? "Planning route..." : "Plan shopping stops"}
            </button>
          </form>

          {error && (
            <p className="mt-4 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}
        </section>

        {plan && plan.stops.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="brand-label">Your shopping route</h2>
              <p className="text-sm text-muted">
                {plan.mode === "scavenger"
                  ? "Scavenger mode — multiple stops along your corridor"
                  : "Efficiency mode — one-stop shop"}
                {plan.totalDetourMeters > 0
                  ? ` · ${formatDetour(plan.totalDetourMeters)} total`
                  : ""}
              </p>
              {priceNote && <p className="text-xs text-muted">{priceNote}</p>}
            </div>

            <div className="flex flex-col gap-3">
              {plan.stops.map((stop, index) => (
                <article key={stop.shop.id} className="brand-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs uppercase tracking-wider text-muted">
                        Stop {index + 1}
                      </span>
                      <h3 className="font-medium text-foreground">
                        {stop.shop.name}
                      </h3>
                      <p className="text-sm text-muted">
                        {formatDetour(stop.detourMeters)} ·{" "}
                        {stop.shop.distanceMeters >= 1000
                          ? `${(stop.shop.distanceMeters / 1000).toFixed(1)} km away`
                          : `${stop.shop.distanceMeters} m away`}
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${stop.shop.lat},${stop.shop.lng}&travelmode=walking`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="brand-button-secondary shrink-0 px-3 py-1.5 text-xs"
                    >
                      Directions
                    </a>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {stop.items.map((item) => (
                      <li
                        key={`${stop.shop.id}-${item}`}
                        className="border border-border bg-accent-subtle px-2.5 py-1 text-xs uppercase tracking-wider text-foreground"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            {plan.uncoveredItems.length > 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Could not assign: {plan.uncoveredItems.join(", ")}
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
