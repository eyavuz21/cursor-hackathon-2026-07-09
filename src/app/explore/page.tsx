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
import { PlaceMap } from "@/components/explore/PlaceMap";
import { PlaceList } from "@/components/explore/PlaceList";

type Coordinates = {
  lat: number;
  lng: number;
};

export default function ExplorePage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        }),
      });

      const data = (await response.json()) as {
        places?: PlaceResult[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load recommendations.");
      }

      setPlaces(data.places ?? []);
      setSelectedPlaceId(data.places?.[0]?.id ?? null);
    },
    [],
  );

  const requestLocation = useCallback(
    async (prefs: UserPreferences) => {
      setLoading(true);
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

          try {
            await loadPlaces(nextCoords, prefs);
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
        await requestLocation(prefs);
      } catch {
        setError("Could not load your preferences. Please try again.");
        setLoading(false);
      }
    }

    init();
  }, [router, requestLocation]);

  async function handleStartOver() {
    await clearPreferences();
    router.push("/onboarding");
  }

  function handleSelectPlace(placeId: string) {
    setSelectedPlaceId(placeId);
    document
      .getElementById(`place-${placeId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  if (loading && !coords) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
        <main className="flex flex-col items-center gap-3">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Finding your location...
          </p>
        </main>
      </div>
    );
  }

  const healthLabel =
    HEALTH_GOAL_OPTIONS.find((option) => option.value === preferences?.healthGoal)
      ?.label ?? "";
  const interestLabels =
    preferences?.interests
      .map(
        (interest) =>
          INTEREST_OPTIONS.find((option) => option.value === interest)?.label,
      )
      .filter(Boolean)
      .join(", ") ?? "";
  const radiusMeters = preferences
    ? getRadiusMeters(preferences.healthGoal)
    : null;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Wander
              </span>
            </div>
            {preferences && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {healthLabel}
                {radiusMeters ? ` · ${radiusMeters >= 1000 ? `${radiusMeters / 1000} km` : `${radiusMeters} m`} radius` : ""}
                {interestLabels ? ` · ${interestLabels}` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleStartOver}
            className="self-start rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Start over
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-6 lg:flex-row">
        {error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
              {error}
            </p>
            {preferences && (
              <button
                type="button"
                onClick={() => requestLocation(preferences)}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Try again
              </button>
            )}
          </div>
        ) : (
          <>
            <section className="h-[320px] shrink-0 lg:h-auto lg:min-h-[520px] lg:flex-1">
              {coords && (
                <PlaceMap
                  userLat={coords.lat}
                  userLng={coords.lng}
                  places={places}
                  selectedPlaceId={selectedPlaceId}
                  onSelectPlace={handleSelectPlace}
                />
              )}
            </section>

            <section className="flex flex-1 flex-col gap-4 lg:max-w-md">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Recommendations
                </h2>
                {loading && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    Loading...
                  </span>
                )}
              </div>
              <PlaceList
                places={places}
                selectedPlaceId={selectedPlaceId}
                onSelectPlace={handleSelectPlace}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
