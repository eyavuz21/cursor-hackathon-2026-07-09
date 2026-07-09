"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import { SOCIAL_VIBE_OPTIONS, TIME_BUDGET_OPTIONS } from "@/lib/onboarding";
import { getSearchRadiusMeters } from "@/lib/places";
import type { JourneyMode, PlaceResult, UserPreferences } from "@/lib/types";
import { saveRecommendedPlaces } from "@/lib/recommended-places";
import { AppHeader } from "@/components/AppHeader";
import { JourneyModeToggle } from "@/components/JourneyModeToggle";
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
  const [searchRadiusMeters, setSearchRadiusMeters] = useState<number | null>(
    null,
  );
  const [modeSaving, setModeSaving] = useState(false);
  const [distanceSpread, setDistanceSpread] = useState<{
    minMeters: number | null;
    maxMeters: number | null;
  } | null>(null);
  const [journeyPlaceIds, setJourneyPlaceIds] = useState<Set<string>>(
    () => new Set(),
  );

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

      setPlaces(data.places ?? []);
      setSearchRadiusMeters(data.searchRadiusMeters ?? null);
      setDistanceSpread(data.distanceSpread ?? null);
      setSelectedPlaceId(data.places?.[0]?.id ?? null);
      const allIds = new Set((data.places ?? []).map((place) => place.id));
      setJourneyPlaceIds(allIds);
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

  useEffect(() => {
    if (!coords || places.length === 0) return;

    saveRecommendedPlaces(coords, places, Array.from(journeyPlaceIds));
  }, [coords, places, journeyPlaceIds]);

  async function handleStartOver() {
    await clearPreferences();
    router.push("/onboarding");
  }

  async function handleModeChange(mode: JourneyMode) {
    if (!preferences || !coords || modeSaving) return;
    if (getJourneyMode(preferences.details) === mode) return;

    setModeSaving(true);
    setError(null);

    try {
      const updated = await updateJourneyMode(mode);
      setPreferences(updated);
      await loadPlaces(coords, updated);
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
  const formatDistance = (meters: number) =>
    meters >= 1000
      ? `${(meters / 1000).toFixed(1)} km`
      : `${meters} m`;
  const minDistance = distanceSpread?.minMeters;
  const maxDistance = distanceSpread?.maxMeters;
  const spreadLabel =
    minDistance != null && maxDistance != null && minDistance !== maxDistance
      ? `Results span ${formatDistance(minDistance)}–${formatDistance(maxDistance)}`
      : maxDistance != null
        ? `Farthest pick is ${formatDistance(maxDistance)} away`
        : null;

  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
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
        {preferences && (
          <div className="relative mt-4">
            <JourneyModeToggle
              value={getJourneyMode(preferences.details)}
              onChange={handleModeChange}
              disabled={modeSaving || loading}
            />
            {modeSaving && (
              <p className="mt-2 text-sm text-muted">
                Updating recommendations...
              </p>
            )}
          </div>
        )}
      </div>

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
                {spreadLabel && (
                  <p className="text-sm text-muted">{spreadLabel}</p>
                )}
                <p className="text-sm text-muted">
                  Pick the places you want, then create your route below.
                </p>
              </div>
              <PlaceList
                places={places}
                selectedPlaceId={selectedPlaceId}
                onSelectPlace={handleSelectPlace}
                journeyPlaceIds={journeyPlaceIds}
                onToggleJourneyPlace={handleToggleJourneyPlace}
              />
              <Link
                href="/plan?create=1"
                className={`brand-button-primary inline-flex w-full justify-center ${
                  journeyPlaceIds.size === 0 ? "pointer-events-none opacity-50" : ""
                }`}
                aria-disabled={journeyPlaceIds.size === 0}
                onClick={(event) => {
                  if (journeyPlaceIds.size === 0) {
                    event.preventDefault();
                  }
                }}
              >
                Create route
                {journeyPlaceIds.size > 0
                  ? ` (${journeyPlaceIds.size} selected)`
                  : ""}
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
