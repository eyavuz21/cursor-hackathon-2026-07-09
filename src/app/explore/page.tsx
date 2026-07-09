"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearPreferences,
  getPreferences,
  HEALTH_GOAL_OPTIONS,
} from "@/lib/preferences";
import { getInterestLabels } from "@/lib/interests";
import { getSearchRadiusMeters } from "@/lib/places";
import { OUTING_STYLE_OPTIONS } from "@/lib/onboarding";
import type { PlaceResult, UserPreferences } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
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
      <div className="flex flex-1 items-center justify-center bg-background px-6 font-sans">
        <main className="flex flex-col items-center gap-3">
          <span className="inline-block h-2 w-2 animate-pulse bg-foreground" />
          <p className="text-sm uppercase tracking-wider text-muted">
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
    preferences?.interests.length
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

  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <AppHeader
        subtitle={
          preferences
            ? [
                healthLabel,
                radiusMeters
                  ? `${radiusMeters >= 1000 ? `${radiusMeters / 1000} km` : `${radiusMeters} m`} radius`
                  : null,
                interestLabels || null,
                outingLabel,
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

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-6 lg:flex-row">
        {error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="max-w-md text-sm text-muted">
              {error}
            </p>
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
                <h2 className="text-lg font-medium tracking-tight text-foreground">
                  Recommendations
                </h2>
                {loading && (
                  <span className="text-sm uppercase tracking-wider text-muted">
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
