"use client";

import { useState } from "react";
import { LoadingOverlay } from "@/components/loading/LoadingOverlay";
import {
  formatDetour,
  formatPriceGbp,
  type ParkingMode,
  type ParkingPlan,
} from "@/lib/parking";
import type { UserPreferences } from "@/lib/types";

type Coordinates = {
  lat: number;
  lng: number;
};

type ParkingPanelProps = {
  coords: Coordinates;
  preferences: UserPreferences;
  destinationQuery?: string;
  defaultOpen?: boolean;
};

const PARKING_PLAN_STEPS = [
  "Find car parks",
  "Check live prices",
  "Rank your options",
];

const MODE_OPTIONS: {
  value: ParkingMode;
  label: string;
  description: string;
}[] = [
  {
    value: "cheapest",
    label: "Cheapest",
    description:
      "Lowest hourly rate when LinkUp is configured — inspired by ParkAndSave.",
  },
  {
    value: "nearest",
    label: "Nearest",
    description: "Closest car park to your journey destination.",
  },
];

export function ParkingPanel({
  coords,
  preferences,
  destinationQuery = "",
  defaultOpen = false,
}: ParkingPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [mode, setMode] = useState<ParkingMode>("cheapest");
  const [plan, setPlan] = useState<ParkingPlan | null>(null);
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
      const response = await fetch("/api/parking-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          startLat: coords.lat,
          startLng: coords.lng,
          destinationQuery: destinationQuery.trim() || undefined,
          healthGoal: preferences.healthGoal,
          details: preferences.details,
        }),
      });

      const data = (await response.json()) as {
        plan?: ParkingPlan;
        priceNote?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not find parking for your journey.");
      }

      setPlan(data.plan ?? null);
      setPriceNote(data.priceNote ?? null);

      if (data.plan?.options.length === 0) {
        setError(
          "No car parks found near your destination. Try picking a destination in a busier area.",
        );
      }
    } catch (planError) {
      setError(
        planError instanceof Error
          ? planError.message
          : "Could not find parking for your journey.",
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
          title="Finding parking near your journey"
          subtitle="Matching car parks to your destination"
          steps={PARKING_PLAN_STEPS}
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
          <span className="brand-label">Add parking (optional)</span>
          <p className="text-sm text-muted">
            Find car parks near your destination — live hourly prices when LinkUp
            is configured.
          </p>
        </div>
        <span className="shrink-0 text-sm text-muted">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="border-t border-border px-6 pb-6 pt-4 wander-screen-enter">
          <form onSubmit={handlePlan} className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              {destinationQuery.trim()
                ? `Searching near ${destinationQuery.trim()} along your journey.`
                : "Select a destination below for best results, or we'll search near you."}
            </p>

            <div className="flex flex-col gap-2">
              <span className="brand-label">Ranking mode</span>
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
              Car parks from OpenStreetMap. With{" "}
              <code className="text-[11px]">LINKUP_API_KEY</code> configured,
              Wander fetches live hourly rates via LinkUp (ParkAndSave-style).
            </p>

            <button
              type="submit"
              disabled={planning}
              className="brand-button-secondary w-full sm:w-auto sm:self-start"
            >
              {planning ? "Finding parking..." : "Find car parks"}
            </button>
          </form>

          {error && (
            <p className="mt-4 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          {plan && plan.options.length > 0 && (
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-foreground">
                    Parking options
                  </h3>
                  <p className="text-sm text-muted">
                    {plan.mode === "cheapest"
                      ? "Ranked by price when available, then distance"
                      : "Ranked by distance to your destination"}
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
                {plan.options.map((option, index) => {
                  const isRecommended = option.lot.id === plan.recommendedLotId;

                  return (
                    <article
                      key={option.lot.id}
                      className={`border p-4 ${
                        isRecommended
                          ? "border-highlight bg-highlight/5"
                          : "border-border bg-surface"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs uppercase tracking-wider text-muted">
                            {isRecommended ? "Recommended" : `Option ${index + 1}`}
                          </span>
                          <h4 className="font-medium text-foreground">
                            {option.lot.name}
                          </h4>
                          <p className="text-sm text-muted">
                            {formatDetour(option.detourMeters)} ·{" "}
                            {option.lot.distanceMeters >= 1000
                              ? `${(option.lot.distanceMeters / 1000).toFixed(1)} km away`
                              : `${option.lot.distanceMeters} m away`}
                            {option.priceGbpPerHour != null
                              ? ` · ${formatPriceGbp(option.priceGbpPerHour)}/hr`
                              : option.lot.feeTag
                                ? ` · ${option.lot.feeTag}`
                                : ""}
                          </p>
                          {option.priceNote && (
                            <p className="text-xs text-muted">{option.priceNote}</p>
                          )}
                        </div>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${option.lot.lat},${option.lot.lng}&travelmode=driving`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="brand-button-secondary shrink-0 px-3 py-1.5 text-xs"
                        >
                          Directions
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>

              {plan.priceSources && plan.priceSources.length > 0 && (
                <p className="text-xs text-muted">
                  Sources:{" "}
                  {plan.priceSources.map((source, index) => (
                    <span key={source.url}>
                      {index > 0 ? ", " : ""}
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="brand-link"
                      >
                        {source.name}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
