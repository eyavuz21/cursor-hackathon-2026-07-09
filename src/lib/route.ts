import type {
  GeocodedDestination,
  HealthGoal,
  JournalStop,
  LatLng,
  PlaceResult,
  TripPlan,
  UserPreferences,
} from "@/lib/types";
import { fetchWalkingRoute } from "@/lib/directions";
import { geocodeDestination } from "@/lib/google-places";
import { getSearchRadiusMeters, searchRecommendations, dedupePlaces } from "@/lib/places";

const EARTH_RADIUS_METERS = 6_371_000;

const MAX_STOPS_BY_HEALTH: Record<HealthGoal, number> = {
  gentle: 3,
  moderate: 5,
  active: 7,
};

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

function projectOntoRoute(
  point: LatLng,
  start: LatLng,
  end: LatLng,
): { t: number; perpendicularMeters: number } {
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return { t: 0, perpendicularMeters: haversineMeters(point, start) };
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.lng - start.lng) * dx + (point.lat - start.lat) * dy) /
        lengthSquared,
    ),
  );

  const projected = interpolate(start, end, t);
  return { t, perpendicularMeters: haversineMeters(point, projected) };
}

function sampleRoutePoints(start: LatLng, end: LatLng, count: number): LatLng[] {
  return Array.from({ length: count }, (_, index) =>
    interpolate(start, end, (index + 1) / (count + 1)),
  );
}

function selectPlacesAlongRoute(
  start: LatLng,
  end: LatLng,
  places: PlaceResult[],
  maxStops: number,
  maxDetourMeters: number,
  options?: { relaxDetour?: boolean },
): PlaceResult[] {
  const scored = places
    .map((place) => {
      const projection = projectOntoRoute(
        { lat: place.lat, lng: place.lng },
        start,
        end,
      );

      return { place, ...projection };
    })
    .filter((entry) => {
      if (entry.t <= 0.05 || entry.t >= 0.95) return false;
      if (options?.relaxDetour) return true;
      return entry.perpendicularMeters <= maxDetourMeters;
    })
    .sort((a, b) => {
      if (b.place.rating !== undefined && a.place.rating !== undefined) {
        const ratingDiff = b.place.rating - a.place.rating;
        if (Math.abs(ratingDiff) > 0.2) return ratingDiff;
      }

      return a.t - b.t;
    });

  const selected: PlaceResult[] = [];
  let lastT = 0;

  for (const entry of scored) {
    if (selected.length >= maxStops) break;
    if (entry.t - lastT < 0.12) continue;
    if (selected.some((place) => place.id === entry.place.id)) continue;

    selected.push(entry.place);
    lastT = entry.t;
  }

  return selected.sort(
    (a, b) =>
      projectOntoRoute({ lat: a.lat, lng: a.lng }, start, end).t -
      projectOntoRoute({ lat: b.lat, lng: b.lng }, start, end).t,
  );
}

export function orderPlacesForWalkingRoute(
  start: LatLng,
  places: PlaceResult[],
  maxStops: number,
): PlaceResult[] {
  const remaining = dedupePlaces(places);
  const ordered: PlaceResult[] = [];
  let current = start;

  while (ordered.length < maxStops && remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < remaining.length; index += 1) {
      const place = remaining[index];
      const distance = haversineMeters(current, {
        lat: place.lat,
        lng: place.lng,
      });

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }

    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    current = { lat: next.lat, lng: next.lng };
  }

  return ordered;
}

function applyLegDistances(
  stops: JournalStop[],
  legDistancesMeters: number[],
): JournalStop[] {
  if (legDistancesMeters.length === 0) return stops;

  return stops.map((stop, index) => {
    if (index === 0) return stop;

    const legDistance = legDistancesMeters[index - 1];
    if (legDistance === undefined) return stop;

    return {
      ...stop,
      distanceFromPreviousMeters: legDistance,
    };
  });
}

async function buildWalkingRouteForStops(
  apiKey: string,
  stops: JournalStop[],
): Promise<{
  routePath: LatLng[];
  stops: JournalStop[];
  totalDistanceMeters: number;
}> {
  const waypoints = stops.map((stop) => ({ lat: stop.lat, lng: stop.lng }));

  try {
    const walkingRoute = await fetchWalkingRoute(apiKey, waypoints);
    const updatedStops = applyLegDistances(
      stops,
      walkingRoute.legDistancesMeters,
    );

    return {
      routePath: walkingRoute.path,
      stops: updatedStops,
      totalDistanceMeters:
        walkingRoute.totalDistanceMeters ||
        updatedStops.reduce(
          (sum, stop) => sum + (stop.distanceFromPreviousMeters ?? 0),
          0,
        ),
    };
  } catch {
    return {
      routePath: buildRoutePath(stops),
      stops,
      totalDistanceMeters: stops.reduce(
        (sum, stop) => sum + (stop.distanceFromPreviousMeters ?? 0),
        0,
      ),
    };
  }
}

export function pickRouteStopsFromRecommendations(
  start: LatLng,
  destination: LatLng,
  recommendedPlaces: PlaceResult[],
  maxStops: number,
  maxDetourMeters: number,
): PlaceResult[] {
  const uniquePlaces = dedupePlaces(recommendedPlaces);
  if (uniquePlaces.length === 0) return [];

  const alongRoute = selectPlacesAlongRoute(
    start,
    destination,
    uniquePlaces,
    maxStops,
    maxDetourMeters,
  );

  if (alongRoute.length > 0) {
    return alongRoute;
  }

  return selectPlacesAlongRoute(
    start,
    destination,
    uniquePlaces,
    maxStops,
    maxDetourMeters,
    { relaxDetour: true },
  );
}

function buildStops(
  start: LatLng & { name?: string },
  destination: GeocodedDestination,
  recommendations: PlaceResult[],
): JournalStop[] {
  const orderedPoints: Array<{
    type: JournalStop["type"];
    name: string;
    address: string;
    lat: number;
    lng: number;
    place?: PlaceResult;
  }> = [
    {
      type: "start",
      name: start.name ?? "Your location",
      address: "Starting point",
      lat: start.lat,
      lng: start.lng,
    },
    ...recommendations.map((place) => ({
      type: "recommendation" as const,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      place,
    })),
    {
      type: "destination",
      name: destination.name,
      address: destination.address,
      lat: destination.lat,
      lng: destination.lng,
    },
  ];

  const stops: JournalStop[] = [];

  for (let index = 0; index < orderedPoints.length; index += 1) {
    const point = orderedPoints[index];
    const previous = orderedPoints[index - 1];

    stops.push({
      id:
        point.type === "recommendation" && point.place
          ? point.place.id
          : `${point.type}-${index}`,
      type: point.type,
      name: point.name,
      address: point.address,
      lat: point.lat,
      lng: point.lng,
      placeId: point.place?.id,
      rating: point.place?.rating,
      googleMapsUri: point.place?.googleMapsUri,
      distanceFromPreviousMeters: previous
        ? haversineMeters(previous, point)
        : undefined,
    });
  }

  return stops;
}

export function buildRoutePath(stops: JournalStop[]): LatLng[] {
  if (stops.length < 2) return stops.map((stop) => ({ lat: stop.lat, lng: stop.lng }));

  const path: LatLng[] = [];

  for (let index = 0; index < stops.length - 1; index += 1) {
    const from = stops[index];
    const to = stops[index + 1];

    for (let step = 0; step <= 8; step += 1) {
      path.push(
        interpolate(
          { lat: from.lat, lng: from.lng },
          { lat: to.lat, lng: to.lng },
          step / 8,
        ),
      );
    }
  }

  return path;
}

export async function buildTripPlan(
  apiKey: string,
  destinationQuery: string | undefined,
  start: LatLng & { name?: string },
  preferences: UserPreferences,
  recommendedPlaces?: PlaceResult[],
): Promise<TripPlan> {
  const radius = Math.min(
    getSearchRadiusMeters(preferences.healthGoal, preferences.details),
    50_000,
  );
  const maxStops = MAX_STOPS_BY_HEALTH[preferences.healthGoal];
  const trimmedQuery = destinationQuery?.trim() ?? "";

  let destination: GeocodedDestination;
  let recommendations: PlaceResult[];
  let resolvedDestinationQuery: string;

  if (recommendedPlaces && recommendedPlaces.length > 0) {
    const orderedPlaces = orderPlacesForWalkingRoute(
      start,
      recommendedPlaces,
      maxStops,
    );

    if (trimmedQuery) {
      const geocoded = await geocodeDestination(apiKey, trimmedQuery, start);
      if (!geocoded) {
        throw new Error(
          "Could not find that destination. Try a city or landmark name.",
        );
      }

      destination = geocoded;
      resolvedDestinationQuery = trimmedQuery;
      recommendations = orderedPlaces.filter(
        (place) =>
          haversineMeters(
            { lat: place.lat, lng: place.lng },
            { lat: destination.lat, lng: destination.lng },
          ) > 75,
      );
    } else if (orderedPlaces.length === 1) {
      const only = orderedPlaces[0];
      destination = {
        name: only.name,
        address: only.address,
        lat: only.lat,
        lng: only.lng,
      };
      resolvedDestinationQuery = only.name;
      recommendations = [];
    } else {
      const last = orderedPlaces[orderedPlaces.length - 1];
      destination = {
        name: last.name,
        address: last.address,
        lat: last.lat,
        lng: last.lng,
      };
      resolvedDestinationQuery = `Walking tour ending at ${last.name}`;
      recommendations = orderedPlaces.slice(0, -1);
    }
  } else {
    if (!trimmedQuery) {
      throw new Error(
        "Add a destination or pick recommendations on Explore to create a route.",
      );
    }

    const geocoded = await geocodeDestination(apiKey, trimmedQuery, start);
    if (!geocoded) {
      throw new Error(
        "Could not find that destination. Try a city or landmark name.",
      );
    }

    destination = geocoded;
    resolvedDestinationQuery = trimmedQuery;

    const samplePoints = sampleRoutePoints(start, destination, 4);
    const placeBatches = await Promise.all(
      samplePoints.map((point) =>
        searchRecommendations({
          apiKey,
          lat: point.lat,
          lng: point.lng,
          healthGoal: preferences.healthGoal,
          interests: preferences.interests,
          details: preferences.details,
        }),
      ),
    );

    recommendations = selectPlacesAlongRoute(
      start,
      destination,
      placeBatches.flat(),
      maxStops,
      radius,
    );
  }

  const initialStops = buildStops(start, destination, recommendations);
  const walkingRoute = await buildWalkingRouteForStops(apiKey, initialStops);

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    destinationQuery: resolvedDestinationQuery,
    destination,
    start,
    stops: walkingRoute.stops,
    routePath: walkingRoute.routePath,
    totalDistanceMeters: walkingRoute.totalDistanceMeters,
  };
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(meters)} m`;
}
