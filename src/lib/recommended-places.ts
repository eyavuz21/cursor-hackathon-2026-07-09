import type { PlaceResult } from "@/lib/types";

const STORAGE_KEY = "wander-recommended-places";

export type SavedRecommendations = {
  savedAt: string;
  origin: { lat: number; lng: number };
  places: PlaceResult[];
  selectedPlaceIds: string[];
};

function isPlaceResult(value: unknown): value is PlaceResult {
  if (!value || typeof value !== "object") return false;

  const place = value as PlaceResult;
  return (
    typeof place.id === "string" &&
    typeof place.name === "string" &&
    typeof place.address === "string" &&
    typeof place.lat === "number" &&
    typeof place.lng === "number"
  );
}

function parseSavedRecommendations(raw: string): SavedRecommendations | null {
  try {
    const parsed = JSON.parse(raw) as SavedRecommendations;
    if (
      !parsed ||
      typeof parsed.savedAt !== "string" ||
      !parsed.origin ||
      typeof parsed.origin.lat !== "number" ||
      typeof parsed.origin.lng !== "number" ||
      !Array.isArray(parsed.places) ||
      !parsed.places.every(isPlaceResult) ||
      !Array.isArray(parsed.selectedPlaceIds) ||
      !parsed.selectedPlaceIds.every((id) => typeof id === "string")
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveRecommendedPlaces(
  origin: { lat: number; lng: number },
  places: PlaceResult[],
  selectedPlaceIds: string[],
): void {
  if (typeof window === "undefined") return;

  const payload: SavedRecommendations = {
    savedAt: new Date().toISOString(),
    origin,
    places,
    selectedPlaceIds,
  };

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function getRecommendedPlaces(): SavedRecommendations | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  return parseSavedRecommendations(raw);
}

export function getSelectedRecommendedPlaces(
  saved: SavedRecommendations | null,
): PlaceResult[] {
  if (!saved || saved.places.length === 0) return [];

  const selected = new Set(
    saved.selectedPlaceIds.length > 0
      ? saved.selectedPlaceIds
      : saved.places.map((place) => place.id),
  );

  return saved.places.filter((place) => selected.has(place.id));
}

export function clearRecommendedPlaces(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
