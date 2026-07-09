"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearPreferences,
  getPreferences,
  getRadiusMeters,
  HEALTH_GOAL_OPTIONS,
  INTEREST_OPTIONS,
} from "@/lib/preferences";
import type { PlaceResult, UserPreferences } from "@/lib/types";
import { PlaceList } from "@/components/explore/PlaceList";
import { PlaceMap } from "@/components/explore/PlaceMap";

type Coordinates = {
  lat: number;
  lng: number;
};

type ExploreState =
  | { status: "loading-prefs" }
  | { status: "loading-location" }
  | { status: "loading-places" }
  | { status: "geo-denied" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      preferences: UserPreferences;
      coordinates: Coordinates;
      places: PlaceResult[];
    };

export default function ExplorePage() {
  const router = useRouter();
  const [state, setState] = useState<ExploreState>({ status: "loading-prefs" });
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const loadPlaces = useCallback(
    async (preferences: UserPreferences, coordinates: Coordinates) => {
      setState({ status: "loading-places" });

      try {
        const response = await fetch("/api/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: coordinates.lat,
            lng: coordinates.lng,
            healthGoal: preferences.healthGoal,
            interests: preferences.interests,
          }),
        });

        const data = (await response.json()) as {
          places?: PlaceResult[];
          error?: string;
        };

        if (!response.ok) {
          setState({
            status: "error",
            message: data.error ?? "Could not load nearby places.",
          });
          return;
        }

        setState({
          status: "ready",
          preferences,
          coordinates,
          places: data.places ?? [],
        });
      } catch {
        setState({
          status: "error",
          message: "Could not load nearby places.",
        });
      }
    },
    [],
  );

  const requestLocation = useCallback(
    (preferences: UserPreferences) => {
      if (!navigator.geolocation) {
        setState({
          status: "error",
          message: "Geolocation is not supported in this browser.",
        });
        return;
      }

      setState({ status: "loading-location" });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          void loadPlaces(preferences, coordinates);
        },
        () => {
          setState({ status: "geo-denied" });
        },
        { enableHighAccuracy: true, timeout: 15000 },
      );
    },
    [loadPlaces],
  );

  useEffect(() => {
    async function init() {
      try {
        const preferences = await getPreferences();

        if (!preferences) {
          router.replace("/onboarding");
          return;
        }

        requestLocation(preferences);
      } catch {
        setState({
          status: "error",
          message: "Could not load your preferences.",
        });
      }
    }

    void init();
  }, [requestLocation, router]);

  async function handleStartOver() {
    setResetting(true);

    try {
      await clearPreferences();
      router.push("/onboarding");
    } catch {
      setState({
        status: "error",
        message: "Could not reset your preferences.",
      });
      setResetting(false);
    }
  }

  function handleRetryLocation() {
    if (state.status === "ready") {
      requestLocation(state.preferences);
      return;
    }

    void (async () => {
      const preferences = await getPreferences();
      if (preferences) {
        requestLocation(preferences);
      } else {
        router.replace("/onboarding");
      }
    })();
  }

  const preferences =
    state.status === "ready" ? state.preferences : null;
  const radiusMeters = preferences
    ? getRadiusMeters(preferences.healthGoal)
    : null;
  const interestLabels = preferences
    ? preferences.interests
        .map(
          (interest) =>
            INTEREST_OPTIONS.find((option) => option.value === interest)
              ?.label ?? interest,
        )
        .join(", ")
    : "";
  const healthLabel = preferences
    ? HEALTH_GOAL_OPTIONS.find(
        (option) => option.value === preferences.healthGoal,
      )?.label
    : "";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Wander
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Explore nearby
            </h1>
            {preferences && radiusMeters !== null && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {healthLabel} · {radiusMeters} m radius · {interestLabels}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleStartOver}
            disabled={resetting}
            className="self-start rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {resetting ? "Resetting..." : "Start over"}
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-6 lg:flex-row">
        {(state.status === "loading-prefs" ||
          state.status === "loading-location" ||
          state.status === "loading-places") && (
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {state.status === "loading-prefs" && "Loading your preferences..."}
                {state.status === "loading-location" &&
                  "Getting your location..."}
                {state.status === "loading-places" &&
                  "Finding places nearby..."}
              </p>
            </div>
          </div>
        )}

        {state.status === "geo-denied" && (
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="flex max-w-md flex-col items-center gap-4 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                We need your location to find nearby places. Allow location access
                in your browser settings, then try again.
              </p>
              <button
                type="button"
                onClick={handleRetryLocation}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {state.status === "error" && (
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="flex max-w-md flex-col items-center gap-4 text-center">
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {state.message}
              </p>
              <button
                type="button"
                onClick={handleRetryLocation}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {state.status === "ready" && (
          <>
            <section className="h-[320px] shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:h-auto lg:min-h-[560px] lg:flex-1">
              <PlaceMap
                userLocation={state.coordinates}
                places={state.places}
                selectedId={selectedPlaceId}
                onSelectPlace={setSelectedPlaceId}
              />
            </section>
            <section className="flex flex-1 flex-col gap-4 lg:max-w-md">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Recommendations
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {state.places.length > 0
                    ? `${state.places.length} places within your walking radius`
                    : "No matches yet"}
                </p>
              </div>
              <PlaceList
                places={state.places}
                selectedId={selectedPlaceId}
                onSelect={setSelectedPlaceId}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
