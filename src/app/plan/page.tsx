"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { JournalTimeline } from "@/components/plan/JournalTimeline";
import { PlanMap } from "@/components/plan/PlanMap";
import { getInterestLabels } from "@/lib/interests";
import { deletePlan, getSavedPlans, savePlan } from "@/lib/journal";
import { formatDistance } from "@/lib/route";
import { formatWalkDuration } from "@/lib/health-route";
import {
  clearPreferences,
  getPreferences,
  HEALTH_GOAL_OPTIONS,
  updateJourneyMode,
} from "@/lib/preferences";
import { getJourneyMode, getJourneyModeLabel } from "@/lib/modes";
import { isHealthOptimisedMode } from "@/lib/mode-preferences";
import { TIME_BUDGET_OPTIONS } from "@/lib/onboarding";
import { getSearchRadiusMeters } from "@/lib/places";
import {
  getRecommendedPlaces,
  getSelectedRecommendedPlaces,
  saveRecommendedPlaces,
} from "@/lib/recommended-places";
import { buildWalkingDirectionsUrl } from "@/lib/google-maps-url";
import type { JourneyMode, PlaceResult, TripPlan, UserPreferences } from "@/lib/types";
import { JourneyModeToggle } from "@/components/JourneyModeToggle";
import { DestinationPicker } from "@/components/plan/DestinationPicker";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { LoadingOverlay } from "@/components/loading/LoadingOverlay";
import { StepProgress } from "@/components/loading/StepProgress";
import { WanderLoader } from "@/components/loading/WanderLoader";

const PLAN_INIT_STEPS = ["Load your profile", "Find your location", "Load your picks"];
const PLAN_BUILD_STEPS = ["Order your stops", "Compute walking route", "Finalise your journal"];

type Coordinates = {
  lat: number;
  lng: number;
};

export default function PlanPage() {
  const router = useRouter();
  const autoCreateAttempted = useRef(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(
    null,
  );
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<TripPlan[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initStep, setInitStep] = useState(0);
  const [planning, setPlanning] = useState(false);
  const [planningStep, setPlanningStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState<PlaceResult[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [modeSaving, setModeSaving] = useState(false);

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

  const loadRecommendedPlaces = useCallback(
    async (position: Coordinates, prefs: UserPreferences) => {
      const saved = getRecommendedPlaces();
      if (saved) {
        setRecommendedPlaces(getSelectedRecommendedPlaces(saved));
        return;
      }

      setLoadingRecommendations(true);

      try {
        const response = await fetch("/api/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: position.lat,
            lng: position.lng,
            healthGoal: prefs.healthGoal,
            interests: prefs.interests,
            details: prefs.details,
          }),
        });

        const data = (await response.json()) as {
          places?: PlaceResult[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load recommendations.");
        }

        const places = data.places ?? [];
        const selectedIds = places.map((place) => place.id);
        saveRecommendedPlaces(position, places, selectedIds);
        setRecommendedPlaces(places);
      } catch {
        setRecommendedPlaces([]);
      } finally {
        setLoadingRecommendations(false);
      }
    },
    [],
  );

  useEffect(() => {
    async function init() {
      try {
        setInitStep(0);
        const prefs = await getPreferences();
        if (!prefs) {
          router.replace("/onboarding");
          return;
        }

        setInitStep(1);
        setPreferences(prefs);
        const position = await requestLocation();
        setInitStep(2);
        setCoords(position);
        setSavedPlans(getSavedPlans());
        await loadRecommendedPlaces(position, prefs);
        setInitStep(3);
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
  }, [loadRecommendedPlaces, requestLocation, router]);

  const handleCreatePlan = useCallback(
    async (
      event?: React.FormEvent<HTMLFormElement>,
      options?: { destinationPlaceId?: string | null },
    ) => {
      event?.preventDefault();

      if (!preferences || !coords) return;

      const destinationPlaceId =
        options?.destinationPlaceId !== undefined
          ? options.destinationPlaceId
          : selectedDestinationId;

      if (recommendedPlaces.length === 0) {
        setError(
          "No recommendations to plan with yet. Visit Explore first or refresh to load nearby picks.",
        );
        return;
      }

      setPlanning(true);
      setPlanningStep(0);
      setError(null);
      setSavedMessage(null);

      const stepTimers = [
        window.setTimeout(() => setPlanningStep(1), 900),
        window.setTimeout(() => setPlanningStep(2), 2200),
      ];

      try {
        const response = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinationPlaceId: destinationPlaceId ?? undefined,
            startLat: coords.lat,
            startLng: coords.lng,
            startName: "Your location",
            healthGoal: preferences.healthGoal,
            interests: preferences.interests,
            details: preferences.details,
            recommendedPlaces,
            healthOptimisedRoute: isHealthOptimisedMode(preferences.details),
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
        setSelectedStopId(
          nextPlan?.stops[1]?.id ?? nextPlan?.stops[0]?.id ?? null,
        );

        const recommendationStops =
          nextPlan?.stops.filter((stop) => stop.type === "recommendation")
            .length ?? 0;
        if (nextPlan && recommendationStops === 0 && destinationPlaceId) {
          setError(
            "Your walking route is ready, but it goes straight to that pick without extra stops along the way.",
          );
        }
      } catch (planError) {
        setError(
          planError instanceof Error
            ? planError.message
            : "Could not build your route.",
        );
      } finally {
        stepTimers.forEach((timer) => window.clearTimeout(timer));
        setPlanning(false);
        setPlanningStep(0);
      }
    },
    [coords, preferences, recommendedPlaces, selectedDestinationId],
  );

  useEffect(() => {
    if (
      autoCreateAttempted.current ||
      loading ||
      planning ||
      plan ||
      recommendedPlaces.length === 0
    ) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("create") !== "1") return;

    autoCreateAttempted.current = true;
    void handleCreatePlan();
  }, [
    handleCreatePlan,
    loading,
    plan,
    planning,
    recommendedPlaces.length,
  ]);

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
    const destinationStop = saved.stops.find((stop) => stop.type === "destination");
    const matchingPlace = recommendedPlaces.find(
      (place) => place.id === destinationStop?.placeId || place.name === destinationStop?.name,
    );
    setSelectedDestinationId(matchingPlace?.id ?? null);
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

  async function handleModeChange(mode: JourneyMode) {
    if (!preferences || modeSaving) return;

    setModeSaving(true);
    setError(null);
    setSavedMessage(null);

    try {
      const updated = await updateJourneyMode(mode);
      setPreferences(updated);
      setPlan(null);
      if (coords) {
        await loadRecommendedPlaces(coords, updated);
      }
    } catch (modeError) {
      setError(
        modeError instanceof Error
          ? modeError.message
          : "Could not update journey mode.",
      );
    } finally {
      setModeSaving(false);
    }
  }

  async function handleStartOver() {
    await clearPreferences();
    router.push("/onboarding");
  }

  if (loading) {
    return (
      <LoadingScreen
        flowLabel="Plan"
        title="Preparing your journal planner"
        subtitle="Setting up your walking route"
        currentStep={Math.min(initStep + 1, PLAN_INIT_STEPS.length)}
        totalSteps={PLAN_INIT_STEPS.length}
        stepLabels={PLAN_INIT_STEPS}
      />
    );
  }

  const healthLabel =
    HEALTH_GOAL_OPTIONS.find((option) => option.value === preferences?.healthGoal)
      ?.label ?? "";
  const interestLabels = preferences?.interests.length
    ? getInterestLabels(preferences.interests).join(", ")
    : "";
  const timeBudgetLabel = preferences?.details?.timeBudget
    ? TIME_BUDGET_OPTIONS.find(
        (option) => option.value === preferences.details?.timeBudget,
      )?.label
    : null;
  const radiusMeters = preferences
    ? getSearchRadiusMeters(preferences.healthGoal, preferences.details)
    : null;

  const journeyModeLabel = preferences
    ? getJourneyModeLabel(getJourneyMode(preferences.details))
    : null;

  const subtitle = preferences
    ? [
        healthLabel,
        radiusMeters
          ? `${radiusMeters >= 1000 ? `${radiusMeters / 1000} km` : `${radiusMeters} m`} detour radius`
          : null,
        interestLabels || null,
        timeBudgetLabel,
        journeyModeLabel,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      {planning && (
        <LoadingOverlay
          title="Building your walking route"
          subtitle="Connecting your Explore picks into one journey"
          steps={PLAN_BUILD_STEPS}
          activeStepIndex={planningStep}
        />
      )}

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
        <div className="max-w-3xl">
          <StepProgress
            label="Plan"
            currentStep={plan ? 2 : 1}
            totalSteps={2}
            steps={["Choose your destination", "Review your route"]}
          />
        </div>

        {!plan && (
        <section className="brand-card p-6 wander-screen-enter">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="brand-heading">
                Plan your outing
              </h1>
              <p className="text-sm leading-relaxed text-muted">
                Choose where to end your walk from your Explore suggestions.
                We&apos;ll build a walking route through your other picks on the
                way there.
              </p>
              {loadingRecommendations ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <WanderLoader size="sm" />
                  <span>Loading your recommendations...</span>
                </div>
              ) : recommendedPlaces.length > 0 ? (
                <p className="text-sm text-muted">
                  Using {recommendedPlaces.length} recommendation
                  {recommendedPlaces.length === 1 ? "" : "s"} from Explore.
                  {" "}
                  <a href="/explore" className="brand-link">
                    Change picks on Explore
                  </a>
                </p>
              ) : (
                <p className="text-sm text-muted">
                  No recommendations saved yet.{" "}
                  <a href="/explore" className="brand-link">
                    Browse Explore first
                  </a>{" "}
                  to pick places for your journey.
                </p>
              )}
            </div>

            {preferences && (
              <JourneyModeToggle
                value={getJourneyMode(preferences.details)}
                onChange={handleModeChange}
                disabled={modeSaving || planning}
              />
            )}

            <form onSubmit={handleCreatePlan} className="flex flex-col gap-4">
              <DestinationPicker
                places={recommendedPlaces}
                value={selectedDestinationId}
                onChange={setSelectedDestinationId}
                disabled={planning || loadingRecommendations}
              />
              <button
                type="submit"
                disabled={planning || recommendedPlaces.length === 0}
                className="brand-button-primary w-full sm:w-auto sm:self-start"
              >
                {planning ? "Creating route..." : "Create walking route"}
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
        )}

        {!plan && savedPlans.length > 0 && (
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
          <div className="flex flex-col gap-4 wander-screen-enter">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted">
                Step 2 — your walking route is ready
              </p>
              <button
                type="button"
                onClick={() => {
                  setPlan(null);
                  setError(null);
                  setSavedMessage(null);
                }}
                className="brand-button-secondary shrink-0 px-3 py-1.5 text-xs"
              >
                Plan again
              </button>
            </div>
            <section className="flex flex-col gap-4 lg:flex-row">
            <div className="h-[360px] shrink-0 lg:h-auto lg:min-h-[560px] lg:flex-1">
              <PlanMap
                stops={plan.stops}
                routePath={plan.routePath}
                selectedStopId={selectedStopId}
                onSelectStop={handleSelectStop}
                totalDistanceMeters={plan.totalDistanceMeters}
                estimatedDurationMinutes={plan.routeStats?.estimatedDurationMinutes}
              />
            </div>

            <div className="flex flex-1 flex-col gap-4 lg:max-w-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-medium tracking-tight text-foreground">
                    Your journal route
                  </h2>
                  <p className="text-sm text-muted">
                    {formatDistance(plan.totalDistanceMeters)} walking route ·{" "}
                    {plan.stops.filter((stop) => stop.type === "recommendation").length}{" "}
                    Explore stops
                    {plan.destination.name ? ` · ending at ${plan.destination.name}` : ""}
                  </p>
                  {plan.routeStats && (
                    <div className="mt-2 flex flex-col gap-1 text-sm text-muted">
                      {plan.routeStats.healthOptimised ? (
                        <>
                          <span>
                            Health-optimised ·{" "}
                            {formatWalkDuration(plan.routeStats.estimatedDurationMinutes)} walk ·{" "}
                            ~{plan.routeStats.estimatedSteps.toLocaleString()} steps
                          </span>
                          <span>
                            +{plan.routeStats.extraStepsVsDirect.toLocaleString()} steps vs direct
                            route ({formatWalkDuration(plan.routeStats.directDurationMinutes)})
                          </span>
                          {!plan.routeStats.withinHourCap && (
                            <span className="text-amber-700 dark:text-amber-300">
                              This route may exceed a 1-hour walk — consider a closer destination.
                            </span>
                          )}
                        </>
                      ) : (
                        <span>
                          ~{formatWalkDuration(plan.routeStats.estimatedDurationMinutes)} walk ·{" "}
                          ~{plan.routeStats.estimatedSteps.toLocaleString()} steps
                        </span>
                      )}
                    </div>
                  )}
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
                href={buildWalkingDirectionsUrl(
                  plan.stops.map((stop) => ({
                    lat: stop.lat,
                    lng: stop.lng,
                    name: stop.name,
                    placeId: stop.placeId,
                    googleMapsUri: stop.googleMapsUri,
                  })),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="brand-button-primary inline-flex justify-center"
              >
                Open full walking route in Google Maps
              </a>
            </div>
          </section>
          </div>
        )}
      </main>
    </div>
  );
}
