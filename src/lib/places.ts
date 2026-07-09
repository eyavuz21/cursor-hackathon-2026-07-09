import type {
  HealthGoal,
  Interest,
  OnboardingDetails,
  PlaceResult,
} from "./types";
import { getRadiusMeters } from "./preferences";

export const MIN_PLACE_RATING = 4.5;
export const MAX_RECOMMENDATIONS = 12;

const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.rating,places.primaryType,places.types,places.userRatingCount";

const LODGING_TYPES = new Set([
  "lodging",
  "hotel",
  "motel",
  "hostel",
  "guest_house",
  "campground",
  "rv_park",
  "bed_and_breakfast",
  "extended_stay_hotel",
  "resort_hotel",
]);

/** Google place type + query per selected interest */
export const INTEREST_SEARCH: Record<
  Interest,
  { includedType: string; textQuery: string }
> = {
  museums: { includedType: "museum", textQuery: "museum" },
  landmarks: { includedType: "tourist_attraction", textQuery: "landmark" },
  churches: { includedType: "church", textQuery: "church" },
  art_galleries: { includedType: "art_gallery", textQuery: "art gallery" },
  historic_sites: { includedType: "monument", textQuery: "historic monument" },
  libraries: { includedType: "library", textQuery: "library" },
  restaurants: { includedType: "restaurant", textQuery: "restaurant" },
  cafes: { includedType: "cafe", textQuery: "cafe" },
  bakeries: { includedType: "bakery", textQuery: "bakery" },
  bars: { includedType: "bar", textQuery: "bar" },
  dessert: { includedType: "ice_cream_shop", textQuery: "dessert" },
  quick_bites: { includedType: "meal_takeaway", textQuery: "takeaway food" },
};

const OUTING_RADIUS_MULTIPLIER: Record<
  NonNullable<OnboardingDetails["outingStyle"]>,
  number
> = {
  scenic: 0.95,
  direct: 1,
  explorer: 1.1,
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  googleMapsUri?: string;
  primaryType?: string;
  types?: string[];
  userRatingCount?: number;
};

export function getSearchRadiusMeters(
  healthGoal: HealthGoal,
  details?: OnboardingDetails,
): number {
  const base = getRadiusMeters(healthGoal);
  const multiplier = details?.outingStyle
    ? OUTING_RADIUS_MULTIPLIER[details.outingStyle]
    : 1;

  return Math.round(base * multiplier);
}

/** @deprecated Use per-interest search in searchRecommendations */
export function getIncludedTypes(interests: Interest[]): string[] {
  return interests.map((interest) => INTEREST_SEARCH[interest].includedType);
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isLodgingPlace(place: GooglePlace): boolean {
  if (place.primaryType && LODGING_TYPES.has(place.primaryType)) {
    return true;
  }

  return (place.types ?? []).some((type) => LODGING_TYPES.has(type));
}

export function isRelevantToInterest(
  place: GooglePlace,
  interest: Interest,
): boolean {
  if (isLodgingPlace(place)) return false;

  const expectedType = INTEREST_SEARCH[interest].includedType;
  const primary = place.primaryType;
  const types = place.types ?? [];

  if (primary === expectedType) return true;
  if (types.includes(expectedType)) return true;

  // Landmarks can surface as point_of_interest alongside tourist_attraction.
  if (
    interest === "landmarks" &&
    (primary === "point_of_interest" || types.includes("point_of_interest"))
  ) {
    return !isLodgingPlace(place);
  }

  return false;
}

export function meetsMinRating(place: GooglePlace): boolean {
  return (place.rating ?? 0) >= MIN_PLACE_RATING;
}

export function normalizePlace(
  place: GooglePlace,
  origin?: { lat: number; lng: number },
): PlaceResult | null {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;

  if (!place.id || lat === undefined || lng === undefined) {
    return null;
  }

  const result: PlaceResult = {
    id: place.id,
    name: place.displayName?.text ?? "Unknown place",
    address: place.formattedAddress ?? "",
    lat,
    lng,
    rating: place.rating,
    googleMapsUri: place.googleMapsUri,
  };

  if (origin) {
    result.distanceMeters = Math.round(
      haversineMeters(origin.lat, origin.lng, lat, lng),
    );
  }

  return result;
}

export function dedupePlaces(places: PlaceResult[]): PlaceResult[] {
  const seen = new Set<string>();

  return places.filter((place) => {
    if (seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });
}

function sortByQualityThenDistance(
  places: PlaceResult[],
): PlaceResult[] {
  return [...places].sort((a, b) => {
    const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
    if (ratingDiff !== 0) return ratingDiff;

    return (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0);
  });
}

export function balancePlacesByInterest(
  byInterest: Map<Interest, PlaceResult[]>,
  limit: number,
): PlaceResult[] {
  const queues = new Map<Interest, PlaceResult[]>();

  for (const [interest, places] of byInterest) {
    queues.set(interest, sortByQualityThenDistance(places));
  }

  const selected: PlaceResult[] = [];
  const interests = Array.from(queues.keys());

  while (selected.length < limit) {
    let added = false;

    for (const interest of interests) {
      const queue = queues.get(interest);
      if (!queue || queue.length === 0) continue;

      const next = queue.shift();
      if (!next) continue;

      if (!selected.some((place) => place.id === next.id)) {
        selected.push(next);
        added = true;
      }

      if (selected.length >= limit) break;
    }

    if (!added) break;
  }

  return selected;
}

async function searchPlacesForInterest(
  apiKey: string,
  interest: Interest,
  lat: number,
  lng: number,
  radius: number,
  pageSize: number,
): Promise<PlaceResult[]> {
  const config = INTEREST_SEARCH[interest];

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: config.textQuery,
        includedType: config.includedType,
        strictTypeFiltering: true,
        minRating: MIN_PLACE_RATING,
        pageSize,
        rankPreference: "RELEVANCE",
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius,
          },
        },
      }),
    },
  );

  const data = (await response.json()) as {
    places?: GooglePlace[];
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Failed to search for ${interest}.`);
  }

  return (data.places ?? [])
    .filter(
      (place) =>
        meetsMinRating(place) &&
        isRelevantToInterest(place, interest) &&
        !isLodgingPlace(place),
    )
    .map((place) => normalizePlace(place, { lat, lng }))
    .filter((place): place is PlaceResult => place !== null);
}

export async function searchRecommendations(params: {
  apiKey: string;
  lat: number;
  lng: number;
  healthGoal: HealthGoal;
  interests: Interest[];
  details?: OnboardingDetails;
}): Promise<PlaceResult[]> {
  const { apiKey, lat, lng, healthGoal, interests, details } = params;
  const radius = getSearchRadiusMeters(healthGoal, details);
  const perInterestLimit = Math.min(
    10,
    Math.max(4, Math.ceil(MAX_RECOMMENDATIONS / interests.length)),
  );

  const results = await Promise.all(
    interests.map(async (interest) => {
      const places = await searchPlacesForInterest(
        apiKey,
        interest,
        lat,
        lng,
        radius,
        perInterestLimit,
      );

      return [interest, places] as const;
    }),
  );

  const byInterest = new Map<Interest, PlaceResult[]>(results);
  const balanced = balancePlacesByInterest(byInterest, MAX_RECOMMENDATIONS);

  return dedupePlaces(
    sortByQualityThenDistance(balanced).filter(
      (place) => (place.distanceMeters ?? 0) <= radius,
    ),
  );
}
