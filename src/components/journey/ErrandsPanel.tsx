"use client";

import { useState } from "react";
import { LoadingOverlay } from "@/components/loading/LoadingOverlay";
import {
  formatDetour,
  formatPriceGbp,
  type ShopPlan,
  type ShoppingMode,
} from "@/lib/shopping";
import type { UserPreferences } from "@/lib/types";

type Coordinates = {
  lat: number;
  lng: number;
};

type ErrandsPanelProps = {
  coords: Coordinates;
  preferences: UserPreferences;
  destinationQuery?: string;
  defaultOpen?: boolean;
};

const SHOP_PLAN_STEPS = ["Find supermarkets", "Check live prices", "Build your route"];

const MODE_OPTIONS: {
  value: ShoppingMode;
  label: string;
  description: string;
}[] = [
  {
    value: "scavenger",
    label: "Scavenger",
    description:
      "Cheapest item per stop along your route — powered by live web prices when LinkUp is configured.",
  },
  {
    value: "efficiency",
    label: "Efficiency",
    description:
      "One supermarket for the whole list — lowest total basket price when live prices are available.",
  },
];

export function ErrandsPanel({
  coords,
  preferences,
  destinationQuery = "",
  defaultOpen = false,
}: ErrandsPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [list, setList] = useState("milk\nbread\neggs\ncoffee");
  const [mode, setMode] = useState<ShoppingMode>("efficiency");
  const [plan, setPlan] = useState<ShopPlan | null>(null);
  const [priceNote, setPriceNote] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planningStep, setPlanningStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handlePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPlanning(true);
    setPlanningStep(0);
    setError(null);
    setPlan(null);
    setPriceNote(null);

    const stepTimers = [
      window.setTimeout(() => setPlanningStep(1), 800),
      window.setTimeout(() => setPlanningStep(2), 1800),
    ];

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
      stepTimers.forEach((timer) => window.clearTimeout(timer));
      setPlanning(false);
      setPlanningStep(0);
    }
  }

  return (
    <section className="brand-card overflow-hidden">
      {planning && (
        <LoadingOverlay
          title="Planning your errand route"
          subtitle="Matching supermarkets to your list"
          steps={SHOP_PLAN_STEPS}
          activeStepIndex={planningStep}
        />
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-accent-subtle/50"
        aria-expanded={open}
      >
        <div className="flex flex-col gap-1">
          <span className="brand-label">Add errands (optional)</span>
          <p className="text-sm text-muted">
            Fold a shopping list into your walk — supermarkets along your corridor.
          </p>
        </div>
        <span className="shrink-0 text-sm text-muted">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="border-t border-border px-6 pb-6 pt-4 wander-screen-enter">
          <form onSubmit={handlePlan} className="flex flex-col gap-4">
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

            <p className="text-xs text-muted">
              Uses your journey destination when set. With{" "}
              <code className="text-[11px]">LINKUP_API_KEY</code> configured,
              Wander fetches live grocery prices via LinkUp.
            </p>

            <button
              type="submit"
              disabled={planning || !list.trim()}
              className="brand-button-secondary w-full sm:w-auto sm:self-start"
            >
              {planning ? "Planning errands..." : "Plan shopping stops"}
            </button>
          </form>

          {error && (
            <p className="mt-4 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          {plan && plan.stops.length > 0 && (
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-foreground">
                    Errand stops
                  </h3>
                  <p className="text-sm text-muted">
                    {plan.mode === "scavenger"
                      ? "Scavenger — multiple stops along your corridor"
                      : "Efficiency — one-stop shop"}
                    {plan.totalDetourMeters > 0
                      ? ` · ${formatDetour(plan.totalDetourMeters)} total`
                      : ""}
                  </p>
                  {plan.priceSummary && (
                    <p className="text-sm text-foreground">{plan.priceSummary}</p>
                  )}
                  {priceNote && <p className="text-xs text-muted">{priceNote}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPlan(null);
                    setPriceNote(null);
                    setError(null);
                  }}
                  className="brand-button-secondary shrink-0 px-3 py-1.5 text-xs"
                >
                  Clear
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {plan.stops.map((stop, index) => (
                  <article key={stop.shop.id} className="border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wider text-muted">
                          Errand {index + 1}
                        </span>
                        <h4 className="font-medium text-foreground">
                          {stop.shop.name}
                        </h4>
                        <p className="text-sm text-muted">
                          {formatDetour(stop.detourMeters)} ·{" "}
                          {stop.shop.distanceMeters >= 1000
                            ? `${(stop.shop.distanceMeters / 1000).toFixed(1)} km away`
                            : `${stop.shop.distanceMeters} m away`}
                          {stop.estimatedTotalGbp != null
                            ? ` · est. ${formatPriceGbp(stop.estimatedTotalGbp)}`
                            : ""}
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
                          {stop.itemPrices?.[item] != null
                            ? ` · ${formatPriceGbp(stop.itemPrices[item])}`
                            : ""}
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
            </div>
          )}
        </div>
      )}
    </section>
  );
}
