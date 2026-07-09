import type { Interest, PlaceResult } from "./types";

const INTEREST_TYPES: Record<Interest, string[]> = {
  history: ["museum", "tourist_attraction", "church"],
  food: ["restaurant", "cafe", "bakery"],
};

export function getIncludedTypes(interests: Interest[]): string[] {
  const types = new Set<string>();

  for (const interest of interests) {
    for (const type of INTEREST_TYPES[interest]) {
      types.add(type);
    }
  }

  return Array.from(types);
}

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  googleMapsUri?: string;
};

export function normalizePlace(place: GooglePlace): PlaceResult | null {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;

  if (!place.id || lat === undefined || lng === undefined) {
    return null;
  }

  return {
    id: place.id,
    name: place.displayName?.text ?? "Unknown place",
    address: place.formattedAddress ?? "",
    lat,
    lng,
    rating: place.rating,
    googleMapsUri: place.googleMapsUri,
  };
}

export function dedupePlaces(places: PlaceResult[]): PlaceResult[] {
  const seen = new Set<string>();

  return places.filter((place) => {
    if (seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });
}
