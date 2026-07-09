"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { JournalTimeline } from "@/components/plan/JournalTimeline";
import { PlanMap } from "@/components/plan/PlanMap";
import { getInterestLabels } from "@/lib/interests";
import { deletePlan, getSavedPlans, savePlan } from "@/lib/journal";
import { formatDistance } from "@/lib/route";
import {
  clearPreferences,
  getPreferences,
  HEALTH_GOAL_OPTIONS,
} from "@/lib/preferences";
import { OUTING_STYLE_OPTIONS } from "@/lib/onboarding";
import { getSearchRadiusMeters } from "@/lib/places";
import type { TripPlan, UserPreferences } from "@/lib/types";

type Coordinates = {
  lat: number;
  lng: number;
};

export default function PlanPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<TripPlan[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

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
        setSavedPlans(getSavedPlans());
      } catch (initError) {
        setError(
          initError instanceof Error
            ? initError.message
            : "Could not prepare the journal planner.",
        );
      } finally {
        setLoading(false);
      }
    }

    void init();
  }, [requestLocation, router]);

  async function handleCreatePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!preferences || !coords) return;

    const query = destinationQuery.trim();
    if (!query) {
      setError("Tell us where you want to go.");
      return;
    }

    setPlanning(true);
    setError(null);
    setSavedMessage(null);

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationQuery: query,
          startLat: coords.lat,
          startLng: coords.lng,
          startName: "Your location",
          healthGoal: preferences.healthGoal,
          interests: preferences.interests,
          details: preferences.details,
        }),
      });

      const data = (await response.json()) as {
        plan?: TripPlan;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not build your route.");
      }

      const nextPlan = data.plan ?? null;
      setPlan(nextPlan);
      setSelectedStopId(nextPlan?.stops[1]?.id ?? nextPlan?.stops[0]?.id ?? null);
    } catch (planError) {
      setError(
        planError instanceof Error
          ? planError.message
          : "Could not build your route.",
      );
    } finally {
      setPlanning(false);
    }
  }

  function handleSelectStop(stopId: string) {
    setSelectedStopId(stopId);
    document
      .getElementById(`journal-stop-${stopId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function handleSavePlan() {
    if (!plan) return;
    savePlan(plan);
    setSavedPlans(getSavedPlans());
    setSavedMessage("Saved to your journal.");
  }

  function handleLoadPlan(saved: TripPlan) {
    setPlan(saved);
    setDestinationQuery(saved.destinationQuery);
    setSelectedStopId(saved.stops[1]?.id ?? saved.stops[0]?.id ?? null);
    setSavedMessage(null);
    setError(null);
  }

  function handleDeletePlan(planId: string) {
    deletePlan(planId);
    setSavedPlans(getSavedPlans());
    if (plan?.id === planId) {
      setPlan(null);
    }
  }

  async function handleStartOver() {
    await clearPreferences();
    router.push("/onboarding");
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background px-6 font-sans">
        <main className="flex flex-col items-center gap-3">
          <span className="inline-block h-2 w-2 animate-pulse bg-foreground" />
          <p className="text-sm uppercase tracking-wider text-muted">
            Preparing your journal planner...
          </p>
        </main>
      </div>
    );
  }

  const healthLabel =
    HEALTH_GOAL_OPTIONS.find((option) => option.value === preferences?.healthGoal)
      ?.label ?? "";
  const interestLabels = preferences?.interests.length
    ? getInterestLabels(preferences.interests).join(", ")
    : "";
  const outingLabel = preferences?.details?.outingStyle
    ? OUTING_STYLE_OPTIONS.find(
        (option) => option.value === preferences.details?.outingStyle,
      )?.label
    : null;
  const radiusMeters = preferences
    ? getSearchRadiusMeters(preferences.healthGoal, preferences.details)
    : null;

  const subtitle = preferences
    ? [
        healthLabel,
        radiusMeters
          ? `${radiusMeters >= 1000 ? `${radiusMeters / 1000} km` : `${radiusMeters} m`} detour radius`
          : null,
        interestLabels || null,
        outingLabel,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <AppHeader
        subtitle={subtitle}
        actions={
          <button
            type="button"
            onClick={handleStartOver}
            className="brand-button-secondary self-start"
          >
            Start over
          </button>
        }
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-6">
        <section className="brand-card p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="brand-heading">
                Plan your outing
              </h1>
              <p className="text-sm leading-relaxed text-muted">
                Tell us where you want to go. We&apos;ll weave personalised
                recommendations into the route based on your walking pace and
                interests.
              </p>
            </div>

            <form onSubmit={handleCreatePlan} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={destinationQuery}
                onChange={(event) => setDestinationQuery(event.target.value)}
                placeholder="e.g. British Museum, Edinburgh, Camden Market"
                className="flex-1 border border-border bg-accent-subtle px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
              />
              <button
                type="submit"
                disabled={planning || !destinationQuery.trim()}
                className="brand-button-primary whitespace-nowrap"
              >
                {planning ? "Building route..." : "Build journal route"}
              </button>
            </form>

            {error && (
              <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}

            {savedMessage && (
              <p className="border border-border bg-accent-subtle px-4 py-3 text-sm text-foreground">
                {savedMessage}
              </p>
            )}
          </div>
        </section>

        {savedPlans.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="brand-label">
              Saved journal entries
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {savedPlans.map((saved) => (
                <div
                  key={saved.id}
                  className="brand-card min-w-[220px] p-4"
                >
                  <p className="font-medium text-foreground">
                    {saved.destination.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatDistance(saved.totalDistanceMeters)} ·{" "}
                    {saved.stops.filter((stop) => stop.type === "recommendation").length}{" "}
                    stops
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadPlan(saved)}
                      className="brand-button-primary px-3 py-1.5 text-xs"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(saved.id)}
                      className="brand-button-secondary px-3 py-1.5 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {plan && (
          <section className="flex flex-col gap-4 lg:flex-row">
            <div className="h-[360px] shrink-0 lg:h-auto lg:min-h-[560px] lg:flex-1">
              <PlanMap
                stops={plan.stops}
                routePath={plan.routePath}
                selectedStopId={selectedStopId}
                onSelectStop={handleSelectStop}
              />
            </div>

            <div className="flex flex-1 flex-col gap-4 lg:max-w-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-medium tracking-tight text-foreground">
                    Your journal route
                  </h2>
                  <p className="text-sm text-muted">
                    {plan.destination.name} · {formatDistance(plan.totalDistanceMeters)} with
                    recommendations woven in
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSavePlan}
                  className="brand-button-secondary shrink-0"
                >
                  Save
                </button>
              </div>

              <JournalTimeline
                stops={plan.stops}
                selectedStopId={selectedStopId}
                onSelectStop={handleSelectStop}
              />

              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${plan.start.lat},${plan.start.lng}&destination=${plan.destination.lat},${plan.destination.lng}&waypoints=${plan.stops
                  .filter((stop) => stop.type === "recommendation")
                  .map((stop) => `${stop.lat},${stop.lng}`)
                  .join("|")}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                className="brand-button-primary inline-flex justify-center"
              >
                Open full walking route in Google Maps
              </a>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
