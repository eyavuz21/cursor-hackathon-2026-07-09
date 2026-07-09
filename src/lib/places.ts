import type { Interest, PlaceResult } from "./types";

const INTEREST_TYPES: Record<Interest, string[]> = {
  history: ["museum", "tourist_attraction", "church"],
  food: ["restaurant", "cafe", "bakery"],
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  rating?: number;
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

export function normalizePlace(raw: GooglePlace): PlaceResult | null {
  const lat = raw.location?.latitude;
  const lng = raw.location?.longitude;
  const name = raw.displayName?.text;
  const id = raw.id;

  if (!id || !name || lat === undefined || lng === undefined) {
    return null;
  }

  return {
    id,
    name,
    address: raw.formattedAddress ?? "",
    lat,
    lng,
    rating: raw.rating,
    googleMapsUri: raw.googleMapsUri,
  };
}
