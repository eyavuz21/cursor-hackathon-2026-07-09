"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { JourneyModeToggle } from "@/components/JourneyModeToggle";
import { PlaceMap } from "@/components/explore/PlaceMap";
import { PlaceList } from "@/components/explore/PlaceList";
import { ErrandsPanel } from "@/components/journey/ErrandsPanel";
import { DestinationPicker } from "@/components/plan/DestinationPicker";
import { JournalTimeline } from "@/components/plan/JournalTimeline";
import { PlanMap } from "@/components/plan/PlanMap";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { LoadingOverlay } from "@/components/loading/LoadingOverlay";
import { StepProgress } from "@/components/loading/StepProgress";
import { SkeletonMap } from "@/components/loading/SkeletonMap";
import { SkeletonPlaceList } from "@/components/loading/SkeletonPlaceList";
import { WanderLoader } from "@/components/loading/WanderLoader";
import { getInterestLabels } from "@/lib/interests";
import { deletePlan, getSavedPlans, savePlan } from "@/lib/journal";
import { formatDistance } from "@/lib/route";
import { formatWalkDuration } from "@/lib/health-route";
import { buildWalkingDirectionsUrl } from "@/lib/google-maps-url";
import { getJourneyMode, getJourneyModeLabel } from "@/lib/modes";
import { isHealthOptimisedMode } from "@/lib/mode-preferences";
import { TIME_BUDGET_OPTIONS } from "@/lib/onboarding";
import {
  clearPreferences,
  getPreferences,
  getRadiusLabel,
  HEALTH_GOAL_OPTIONS,
  updateJourneyMode,
} from "@/lib/preferences";
import { getSearchRadiusMeters } from "@/lib/places";
import { rankPlacesForJourney } from "@/lib/place-ranking";
import {
  getRecommendedPlaces,
  saveRecommendedPlaces,
} from "@/lib/recommended-places";
import { SOCIAL_VIBE_OPTIONS } from "@/lib/onboarding";
import type { JourneyMode, PlaceResult, TripPlan, UserPreferences } from "@/lib/types";

type Coordinates = {
  lat: number;
  lng: number;
};

type JourneyPhase = "locating" | "discovering" | "ready";

const JOURNEY_STEPS = ["Discover & pick", "Plan your route", "Your journey"];
const INIT_STEPS = ["Load your profile", "Find your location", "Discover nearby places"];
const PLAN_BUILD_STEPS = ["Order your stops", "Compute walking route", "Finalise your journey"];

export default function JourneyPage() {
  const router = useRouter();
  const autoCreateAttempted = useRef(false);

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [journeyPlaceIds, setJourneyPlaceIds] = useState<Set<string>>(() => new Set());
  const [phase, setPhase] = useState<JourneyPhase>("locating");
  const [initStep, setInitStep] = useState(0);
  const [searchRadiusMeters, setSearchRadiusMeters] = useState<number | null>(null);
  const [distanceSpread, setDistanceSpread] = useState<{
    minMeters: number | null;
    maxMeters: number | null;
  } | null>(null);

  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<TripPlan[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [planningStep, setPlanningStep] = useState(0);
  const [modeSaving, setModeSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errandsOpen, setErrandsOpen] = useState(false);

  const recommendedPlaces = rankPlacesForJourney(
    places.filter((place) => journeyPlaceIds.has(place.id)),
    preferences?.details,
  );

  const loadPlaces = useCallback(
    async (position: Coordinates, prefs: UserPreferences) => {
      const saved = getRecommendedPlaces();
      if (saved && saved.places.length > 0) {
        const ranked = rankPlacesForJourney(saved.places, prefs.details);
        setPlaces(ranked);
        setSearchRadiusMeters(
          getSearchRadiusMeters(prefs.healthGoal, prefs.details),
        );
        setSelectedPlaceId(ranked[0]?.id ?? null);
        setJourneyPlaceIds(new Set(saved.selectedPlaceIds));
        return;
      }

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
        searchRadiusMeters?: number;
        distanceSpread?: {
          minMeters: number | null;
          maxMeters: number | null;
        };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load recommendations.");
      }

      const ranked = rankPlacesForJourney(data.places ?? [], prefs.details);
      setPlaces(ranked);
      setSearchRadiusMeters(data.searchRadiusMeters ?? null);
      setDistanceSpread(data.distanceSpread ?? null);
      setSelectedPlaceId(ranked[0]?.id ?? null);
      const allIds = new Set(ranked.map((place) => place.id));
      setJourneyPlaceIds(allIds);
    },
    [],
  );

  const requestLocation = useCallback(
    async (prefs: UserPreferences) => {
      setPhase("locating");
      setError(null);

      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported in this browser.");
      }

      return new Promise<Coordinates>((resolve, reject) => {
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
      }).then(async (position) => {
        setCoords(position);
        setPhase("discovering");
        await loadPlaces(position, prefs);
        setPhase("ready");
        return position;
      });
    },
    [loadPlaces],
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
        await requestLocation(prefs);
        setInitStep(2);
        setSavedPlans(getSavedPlans());

        const params = new URLSearchParams(window.location.search);
        if (params.get("errands") === "1") {
          setErrandsOpen(true);
        }
      } catch (initError) {
        setError(
          initError instanceof Error
            ? initError.message
            : "Could not prepare your journey.",
        );
      } finally {
        setLoading(false);
      }
    }

    void init();
  }, [requestLocation, router]);

  useEffect(() => {
    if (!coords || places.length === 0) return;
    saveRecommendedPlaces(coords, places, Array.from(journeyPlaceIds));
  }, [coords, places, journeyPlaceIds]);

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
        setError("Pick at least one place on the map before creating your route.");
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
            recommendedPlaces: rankPlacesForJourney(
              recommendedPlaces,
              preferences.details,
            ),
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
  }, [handleCreatePlan, loading, plan, planning, recommendedPlaces.length]);

  function handleToggleJourneyPlace(placeId: string) {
    setJourneyPlaceIds((current) => {
      const next = new Set(current);
      if (next.has(placeId)) {
        next.delete(placeId);
      } else {
        next.add(placeId);
      }
      return next;
    });
  }

  function handleSelectPlace(placeId: string) {
    setSelectedPlaceId(placeId);
    document
      .getElementById(`place-${placeId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
    const destinationStop = saved.stops.find((stop) => stop.type === "destination");
    const matchingPlace = places.find(
      (place) =>
        place.id === destinationStop?.placeId || place.name === destinationStop?.name,
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
    if (!preferences || !coords || modeSaving) return;
    if (getJourneyMode(preferences.details) === mode) return;

    setModeSaving(true);
    setPhase("discovering");
    setError(null);
    setPlan(null);
    setSavedMessage(null);

    try {
      const updated = await updateJourneyMode(mode);
      setPreferences(updated);
      await loadPlaces(coords, updated);
      setPhase("ready");
    } catch (modeError) {
      setError(
        modeError instanceof Error
          ? modeError.message
          : "Could not update journey mode.",
      );
      setPhase("ready");
    } finally {
      setModeSaving(false);
    }
  }

  async function handleStartOver() {
    await clearPreferences();
    router.push("/onboarding");
  }

  if (loading || phase === "locating") {
    return (
      <LoadingScreen
        flowLabel="Journey"
        title="Preparing your journey"
        subtitle="Finding nearby places tailored to your vibe"
        currentStep={Math.min(initStep + 1, INIT_STEPS.length)}
        totalSteps={INIT_STEPS.length}
        stepLabels={INIT_STEPS}
      />
    );
  }

  const healthLabel =
    HEALTH_GOAL_OPTIONS.find((option) => option.value === preferences?.healthGoal)
      ?.label ?? "";
  const chosenRadiusLabel = preferences ? getRadiusLabel(preferences.healthGoal) : "";
  const interestLabels = preferences?.interests.length
    ? getInterestLabels(preferences.interests).join(", ")
    : "";
  const socialVibeLabels =
    preferences?.details?.socialVibes && preferences.details.socialVibes.length > 0
      ? preferences.details.socialVibes
          .map(
            (vibe) =>
              SOCIAL_VIBE_OPTIONS.find((option) => option.value === vibe)?.label ??
              vibe,
          )
          .join(", ")
      : "";
  const timeBudgetLabel = preferences?.details?.timeBudget
    ? TIME_BUDGET_OPTIONS.find(
        (option) => option.value === preferences.details?.timeBudget,
      )?.label
    : null;
  const journeyModeLabel = preferences
    ? getJourneyModeLabel(getJourneyMode(preferences.details))
    : null;
  const radiusMeters =
    searchRadiusMeters ??
    (preferences
      ? getSearchRadiusMeters(preferences.healthGoal, preferences.details)
      : null);
  const formatDistanceLabel = (meters: number) =>
    meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
  const minDistance = distanceSpread?.minMeters;
  const maxDistance = distanceSpread?.maxMeters;
  const spreadLabel =
    minDistance != null && maxDistance != null && minDistance !== maxDistance
      ? `Results span ${formatDistanceLabel(minDistance)}–${formatDistanceLabel(maxDistance)}`
      : maxDistance != null
        ? `Farthest pick is ${formatDistanceLabel(maxDistance)} away`
        : null;

  const destinationName =
    recommendedPlaces.find((place) => place.id === selectedDestinationId)?.name ?? "";

  const currentStep = plan ? 3 : recommendedPlaces.length > 0 ? 2 : 1;

  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      {planning && (
        <LoadingOverlay
          title="Building your walking route"
          subtitle="Connecting your picks into one journey"
          steps={PLAN_BUILD_STEPS}
          activeStepIndex={planningStep}
        />
      )}

      <AppHeader
        subtitle={
          preferences
            ? [
                healthLabel,
                chosenRadiusLabel || null,
                interestLabels || null,
                socialVibeLabels || null,
                timeBudgetLabel,
                journeyModeLabel,
                "4.5+ stars",
              ]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
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
        <StepProgress
          label="Journey"
          currentStep={currentStep}
          totalSteps={JOURNEY_STEPS.length}
          steps={JOURNEY_STEPS}
        />

        {preferences && !plan && (
          <div className="relative">
            <JourneyModeToggle
              value={getJourneyMode(preferences.details)}
              onChange={handleModeChange}
              disabled={modeSaving || phase === "discovering"}
            />
            {modeSaving && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                <WanderLoader size="sm" />
                <span>Updating recommendations...</span>
              </div>
            )}
          </div>
        )}

        {error && !plan && (
          <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {!plan && (
          <div className="flex flex-col gap-6 lg:flex-row">
            {phase === "discovering" ? (
              <>
                <section className="h-[320px] shrink-0 lg:h-auto lg:min-h-[520px] lg:flex-1">
                  <SkeletonMap />
                </section>
                <section className="flex flex-1 flex-col gap-4 lg:max-w-md">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <WanderLoader size="sm" />
                      <h2 className="text-lg font-medium tracking-tight text-foreground">
                        Discovering places
                      </h2>
                    </div>
                    <p className="text-sm text-muted">
                      Matching spots to your vibe within your search radius…
                    </p>
                  </div>
                  <SkeletonPlaceList count={5} />
                </section>
              </>
            ) : (
              <div className="contents wander-screen-enter">
                <section className="h-[320px] shrink-0 lg:h-auto lg:min-h-[520px] lg:flex-1">
                  {coords && radiusMeters && (
                    <PlaceMap
                      userLat={coords.lat}
                      userLng={coords.lng}
                      searchRadiusMeters={radiusMeters}
                      places={places}
                      selectedPlaceId={selectedPlaceId}
                      onSelectPlace={handleSelectPlace}
                    />
                  )}
                </section>

                <section className="flex flex-1 flex-col gap-4 lg:max-w-md">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-medium tracking-tight text-foreground">
                      Pick your stops
                    </h2>
                    {spreadLabel && (
                      <p className="text-sm text-muted">{spreadLabel}</p>
                    )}
                    <p className="text-sm text-muted">
                      Top-rated picks for your vibe — highest stars first. Choose
                      your stops, then build your walking route below.
                    </p>
                  </div>
                  <PlaceList
                    places={places}
                    selectedPlaceId={selectedPlaceId}
                    onSelectPlace={handleSelectPlace}
                    journeyPlaceIds={journeyPlaceIds}
                    onToggleJourneyPlace={handleToggleJourneyPlace}
                  />
                </section>
              </div>
            )}
          </div>
        )}

        {!plan && phase === "ready" && coords && preferences && (
          <div className="flex flex-col gap-6 wander-screen-enter">
            <ErrandsPanel
              coords={coords}
              preferences={preferences}
              destinationQuery={destinationName}
              defaultOpen={errandsOpen}
            />

            <section className="brand-card p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="brand-heading">Plan your route</h2>
                  <p className="text-sm leading-relaxed text-muted">
                    Choose where to end your walk. We&apos;ll route through your
                    highest-rated other picks on the way there.
                  </p>
                  {recommendedPlaces.length > 0 ? (
                    <p className="text-sm text-muted">
                      {recommendedPlaces.length} place
                      {recommendedPlaces.length === 1 ? "" : "s"} selected for this
                      journey.
                    </p>
                  ) : (
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Select at least one place above to continue.
                    </p>
                  )}
                </div>

                <form onSubmit={handleCreatePlan} className="flex flex-col gap-4">
                  <DestinationPicker
                    places={recommendedPlaces}
                    value={selectedDestinationId}
                    onChange={setSelectedDestinationId}
                    disabled={planning || recommendedPlaces.length === 0}
                  />
                  <button
                    type="submit"
                    disabled={planning || recommendedPlaces.length === 0}
                    className="brand-button-primary w-full sm:w-auto sm:self-start"
                  >
                    {planning
                      ? "Creating route..."
                      : `Create walking route${
                          recommendedPlaces.length > 0
                            ? ` (${recommendedPlaces.length} stops)`
                            : ""
                        }`}
                  </button>
                </form>

                {savedMessage && (
                  <p className="border border-border bg-accent-subtle px-4 py-3 text-sm text-foreground">
                    {savedMessage}
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {!plan && savedPlans.length > 0 && phase === "ready" && (
          <section className="flex flex-col gap-3">
            <h2 className="brand-label">Saved journal entries</h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {savedPlans.map((saved) => (
                <div key={saved.id} className="brand-card min-w-[220px] p-4">
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
              <p className="text-sm text-muted">Your journey is ready</p>
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

            {error && (
              <p className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                {error}
              </p>
            )}

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
                      Your journey
                    </h2>
                    <p className="text-sm text-muted">
                      {formatDistance(plan.totalDistanceMeters)} walking route ·{" "}
                      {plan.stops.filter((stop) => stop.type === "recommendation").length}{" "}
                      stops
                      {plan.destination.name ? ` · ending at ${plan.destination.name}` : ""}
                    </p>
                    {plan.routeStats && (
                      <div className="mt-2 flex flex-col gap-1 text-sm text-muted">
                        {plan.routeStats.healthOptimised ? (
                          <>
                            <span>
                              Health-optimised ·{" "}
                              {formatWalkDuration(plan.routeStats.estimatedDurationMinutes)}{" "}
                              walk · ~{plan.routeStats.estimatedSteps.toLocaleString()} steps
                            </span>
                            <span>
                              +{plan.routeStats.extraStepsVsDirect.toLocaleString()} steps vs
                              direct route (
                              {formatWalkDuration(plan.routeStats.directDurationMinutes)})
                            </span>
                            {!plan.routeStats.withinHourCap && (
                              <span className="text-amber-700 dark:text-amber-300">
                                This route may exceed a 1-hour walk — consider a closer
                                destination.
                              </span>
                            )}
                          </>
                        ) : (
                          <span>
                            ~{formatWalkDuration(plan.routeStats.estimatedDurationMinutes)} walk
                            · ~{plan.routeStats.estimatedSteps.toLocaleString()} steps
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
