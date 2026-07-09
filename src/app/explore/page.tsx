"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearPreferences,
  getPreferences,
  getRadiusLabel,
  HEALTH_GOAL_OPTIONS,
  updateJourneyMode,
} from "@/lib/preferences";
import { getInterestLabels } from "@/lib/interests";
import { getJourneyMode, getJourneyModeLabel } from "@/lib/modes";
import { isHealthOptimisedMode } from "@/lib/mode-preferences";
import { SOCIAL_VIBE_OPTIONS, TIME_BUDGET_OPTIONS } from "@/lib/onboarding";
import { getSearchRadiusMeters } from "@/lib/places";
import { rankPlacesForJourney } from "@/lib/place-ranking";
import { deletePlan, getSavedPlans, savePlan } from "@/lib/journal";
import { formatDistance } from "@/lib/route";
import type { JourneyMode, PlaceResult, TripPlan, UserPreferences } from "@/lib/types";
import { saveRecommendedPlaces } from "@/lib/recommended-places";
import { AppHeader } from "@/components/AppHeader";
import { JourneyModeToggle } from "@/components/JourneyModeToggle";
import { PlaceMap } from "@/components/explore/PlaceMap";
import { PlaceList } from "@/components/explore/PlaceList";
import { JourneyRoutePanel } from "@/components/explore/JourneyRoutePanel";
import { DestinationPicker } from "@/components/plan/DestinationPicker";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { LoadingOverlay } from "@/components/loading/LoadingOverlay";
import { StepProgress } from "@/components/loading/StepProgress";
import { SkeletonMap } from "@/components/loading/SkeletonMap";
import { SkeletonPlaceList } from "@/components/loading/SkeletonPlaceList";
import { WanderLoader } from "@/components/loading/WanderLoader";

type Coordinates = {
  lat: number;
  lng: number;
};

type ExplorePhase = "locating" | "discovering" | "ready";
type JourneyView = "picks" | "route";

const INIT_STEPS = ["Find your location", "Discover nearby places"];
const JOURNEY_STEPS = ["Pick places", "Your route"];
const ROUTE_BUILD_STEPS = ["Order your stops", "Compute walking route", "Finalise your journey"];

export default function ExplorePage() {
  const router = useRouter();
  const autoCreateAttempted = useRef(false);

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<ExplorePhase>("locating");
  const [view, setView] = useState<JourneyView>("picks");
  const [error, setError] = useState<string | null>(null);
  const [searchRadiusMeters, setSearchRadiusMeters] = useState<number | null>(null);
  const [modeSaving, setModeSaving] = useState(false);
  const [distanceSpread, setDistanceSpread] = useState<{
    minMeters: number | null;
    maxMeters: number | null;
  } | null>(null);
  const [journeyPlaceIds, setJourneyPlaceIds] = useState<Set<string>>(() => new Set());
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planningStep, setPlanningStep] = useState(0);
  const [savedPlans, setSavedPlans] = useState<TripPlan[]>([]);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const selectedPlaces = places.filter((place) => journeyPlaceIds.has(place.id));

  const loadPlaces = useCallback(
    async (position: Coordinates, prefs: UserPreferences) => {
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
      setPlan(null);
      setView("picks");
    },
    [],
  );

  const requestLocation = useCallback(
    async (prefs: UserPreferences) => {
      setLoading(true);
      setPhase("locating");
      setError(null);

      if (!navigator.geolocation) {
        setError("Geolocation is not supported in this browser.");
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const nextCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setCoords(nextCoords);
          setPhase("discovering");

          try {
            await loadPlaces(nextCoords, prefs);
            setPhase("ready");
          } catch (loadError) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Failed to load recommendations.",
            );
          } finally {
            setLoading(false);
          }
        },
        () => {
          setError(
            "Location access was denied. Enable location permissions and try again.",
          );
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    },
    [loadPlaces],
  );

  useEffect(() => {
    async function init() {
      try {
        const prefs = await getPreferences();

        if (!prefs) {
          router.replace("/onboarding");
          return;
        }

        setPreferences(prefs);
        setSavedPlans(getSavedPlans());
        await requestLocation(prefs);
      } catch {
        setError("Could not load your preferences. Please try again.");
        setLoading(false);
      }
    }

    init();
  }, [router, requestLocation]);

  useEffect(() => {
    if (!coords || places.length === 0) return;
    saveRecommendedPlaces(coords, places, Array.from(journeyPlaceIds));
  }, [coords, places, journeyPlaceIds]);

  const handleCreateRoute = useCallback(async () => {
    if (!preferences || !coords || selectedPlaces.length === 0) return;

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
          destinationPlaceId: selectedDestinationId ?? undefined,
          startLat: coords.lat,
          startLng: coords.lng,
          startName: "Your location",
          healthGoal: preferences.healthGoal,
          interests: preferences.interests,
          details: preferences.details,
          recommendedPlaces: rankPlacesForJourney(
            selectedPlaces,
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
      setView("route");
      setSelectedStopId(
        nextPlan?.stops[1]?.id ?? nextPlan?.stops[0]?.id ?? null,
      );
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
  }, [coords, preferences, selectedDestinationId, selectedPlaces]);

  useEffect(() => {
    if (
      autoCreateAttempted.current ||
      phase !== "ready" ||
      planning ||
      plan ||
      selectedPlaces.length === 0
    ) {
      return;
    }

    if (new URLSearchParams(window.location.search).get("create") !== "1") return;

    autoCreateAttempted.current = true;
    void handleCreateRoute();
  }, [handleCreateRoute, phase, plan, planning, selectedPlaces.length]);

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
    setPlan(null);
    setView("picks");
  }

  async function handleStartOver() {
    await clearPreferences();
    router.push("/onboarding");
  }

  async function handleModeChange(mode: JourneyMode) {
    if (!preferences || !coords || modeSaving) return;
    if (getJourneyMode(preferences.details) === mode) return;

    setModeSaving(true);
    setPhase("discovering");
    setError(null);

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
    } finally {
      setModeSaving(false);
    }
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
    setView("route");
    setSelectedStopId(saved.stops[1]?.id ?? saved.stops[0]?.id ?? null);
    setSavedMessage(null);
    setError(null);
  }

  function handleDeletePlan(planId: string) {
    deletePlan(planId);
    setSavedPlans(getSavedPlans());
    if (plan?.id === planId) {
      setPlan(null);
      setView("picks");
    }
  }

  function handleEditPicks() {
    setPlan(null);
    setView("picks");
    setSavedMessage(null);
    setError(null);
  }

  if (phase === "locating") {
    return (
      <LoadingScreen
        flowLabel="Wander"
        title="Finding your location"
        subtitle="We need this to surface nearby recommendations"
        currentStep={1}
        totalSteps={INIT_STEPS.length}
        stepLabels={INIT_STEPS}
      />
    );
  }

  const healthLabel =
    HEALTH_GOAL_OPTIONS.find((option) => option.value === preferences?.healthGoal)
      ?.label ?? "";
  const chosenRadiusLabel = preferences
    ? getRadiusLabel(preferences.healthGoal)
    : "";
  const interestLabels =
    preferences?.interests.length
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
    meters >= 1000
      ? `${(meters / 1000).toFixed(1)} km`
      : `${meters} m`;
  const minDistance = distanceSpread?.minMeters;
  const maxDistance = distanceSpread?.maxMeters;
  const spreadLabel =
    minDistance != null && maxDistance != null && minDistance !== maxDistance
      ? `Results span ${formatDistanceLabel(minDistance)}–${formatDistanceLabel(maxDistance)}`
      : maxDistance != null
        ? `Farthest pick is ${formatDistanceLabel(maxDistance)} away`
        : null;

  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      {planning && (
        <LoadingOverlay
          title="Building your walking route"
          subtitle="Connecting your picks into one journey"
          steps={ROUTE_BUILD_STEPS}
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

      <div className="mx-auto w-full max-w-6xl px-6 pt-4">
        <StepProgress
          label="Wander"
          currentStep={view === "route" ? 2 : 1}
          totalSteps={JOURNEY_STEPS.length}
          steps={JOURNEY_STEPS}
        />
        {preferences && view === "picks" && (
          <div className="relative mt-4">
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
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-6">
        {error && !coords ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="max-w-md text-sm text-muted">{error}</p>
            {preferences && (
              <button
                type="button"
                onClick={() => requestLocation(preferences)}
                className="brand-button-primary"
              >
                Try again
              </button>
            )}
          </div>
        ) : (
          <>
        {error && coords && (
          <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {savedPlans.length > 0 && view === "picks" && (
          <section className="flex flex-col gap-3">
            <h2 className="brand-label">Saved routes</h2>
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

        <div className="flex flex-1 flex-col gap-6 lg:flex-row">
          {phase === "discovering" ? (
            <>
              <section className="h-[320px] shrink-0 lg:h-auto lg:min-h-[520px] lg:flex-1">
                <SkeletonMap />
              </section>
              <section className="flex flex-1 flex-col gap-4 lg:max-w-md">
                <div className="flex items-center gap-2">
                  <WanderLoader size="sm" />
                  <h2 className="text-lg font-medium tracking-tight text-foreground">
                    Discovering places
                  </h2>
                </div>
                <SkeletonPlaceList count={5} />
              </section>
            </>
          ) : view === "route" && plan ? (
            <div className="contents wander-screen-enter">
              <JourneyRoutePanel
                plan={plan}
                selectedStopId={selectedStopId}
                onSelectStop={handleSelectStop}
                onSave={handleSavePlan}
                onEditPicks={handleEditPicks}
                savedMessage={savedMessage}
              />
            </div>
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
                    Top-rated picks for your vibe — check the ones you want,
                    choose where to end up, then create your route.
                  </p>
                </div>

                <PlaceList
                  places={places}
                  selectedPlaceId={selectedPlaceId}
                  onSelectPlace={handleSelectPlace}
                  journeyPlaceIds={journeyPlaceIds}
                  onToggleJourneyPlace={handleToggleJourneyPlace}
                />

                {selectedPlaces.length > 0 && (
                  <div className="flex flex-col gap-4 border-t border-border pt-4">
                    <DestinationPicker
                      places={selectedPlaces}
                      value={selectedDestinationId}
                      onChange={setSelectedDestinationId}
                      disabled={planning}
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreateRoute()}
                      disabled={planning || selectedPlaces.length === 0}
                      className="brand-button-primary w-full justify-center"
                    >
                      Create route
                      {selectedPlaces.length > 0
                        ? ` (${selectedPlaces.length} selected)`
                        : ""}
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
          </>
        )}
      </main>
    </div>
  );
}
