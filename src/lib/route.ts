import {
  estimateSteps,
  estimateWalkMinutes,
  MAX_WALK_MINUTES,
  WALKING_SPEED_M_PER_MIN,
  WALK_TIME_BUFFER_MINUTES,
} from "@/lib/health-route";
import type {
  GeocodedDestination,
  HealthGoal,
  JournalStop,
  LatLng,
  PlaceResult,
  RouteStats,
  TripPlan,
  UserPreferences,
} from "@/lib/types";
import { getSearchRadiusMeters, searchRecommendations } from "@/lib/places";
import {
  getJourneyMode,
  getModeDetourMultiplier,
  getModeRouteStopsOffset,
} from "@/lib/modes";
import { isHealthOptimisedMode } from "@/lib/mode-preferences";

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
    .filter(
      (entry) =>
        entry.t > 0.05 &&
        entry.t < 0.95 &&
        entry.perpendicularMeters <= maxDetourMeters,
    )
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

function routeDistanceWithStops(
  start: LatLng,
  destination: GeocodedDestination,
  recommendations: PlaceResult[],
): number {
  if (recommendations.length === 0) {
    return haversineMeters(start, destination);
  }

  const ordered = [...recommendations].sort(
    (a, b) =>
      projectOntoRoute({ lat: a.lat, lng: a.lng }, start, destination).t -
      projectOntoRoute({ lat: b.lat, lng: b.lng }, start, destination).t,
  );

  let total = 0;
  let previous: LatLng = start;

  for (const place of ordered) {
    total += haversineMeters(previous, place);
    previous = place;
  }

  total += haversineMeters(previous, destination);
  return total;
}

function selectHealthOptimisedStops(
  start: LatLng,
  end: GeocodedDestination,
  places: PlaceResult[],
  maxDetourMeters: number,
  directMeters: number,
  maxWalkMinutes: number = MAX_WALK_MINUTES,
): PlaceResult[] {
  const directMinutes = estimateWalkMinutes(directMeters);

  if (directMinutes >= maxWalkMinutes - WALK_TIME_BUFFER_MINUTES) {
    return selectPlacesAlongRoute(start, end, places, 1, maxDetourMeters * 0.4);
  }

  const slackMinutes =
    maxWalkMinutes - WALK_TIME_BUFFER_MINUTES - directMinutes;
  const maxTotalMeters =
    directMeters + slackMinutes * WALKING_SPEED_M_PER_MIN * 0.92;

  const candidates = places
    .map((place) => ({
      place,
      ...projectOntoRoute({ lat: place.lat, lng: place.lng }, start, end),
    }))
    .filter(
      (entry) =>
        entry.t > 0.03 &&
        entry.t < 0.97 &&
        entry.perpendicularMeters <= maxDetourMeters * 1.2,
    )
    .sort((a, b) => a.t - b.t);

  const selected: PlaceResult[] = [];
  let currentDistance = directMeters;

  for (const entry of candidates) {
    if (selected.length >= 8) break;
    if (selected.some((place) => place.id === entry.place.id)) continue;

    const minSpacing = selected.length === 0 ? 0 : 0.06;
    const lastT =
      selected.length > 0
        ? projectOntoRoute(
            {
              lat: selected[selected.length - 1].lat,
              lng: selected[selected.length - 1].lng,
            },
            start,
            end,
          ).t
        : 0;

    if (entry.t - lastT < minSpacing) continue;

    const trial = [...selected, entry.place];
    const trialDistance = routeDistanceWithStops(start, end, trial);
    const gain = trialDistance - currentDistance;

    if (trialDistance > maxTotalMeters) continue;
    if (gain < 60 && selected.length > 0) continue;

    selected.push(entry.place);
    currentDistance = trialDistance;

    if (estimateWalkMinutes(currentDistance) >= maxWalkMinutes - WALK_TIME_BUFFER_MINUTES) {
      break;
    }
  }

  return selected.sort(
    (a, b) =>
      projectOntoRoute({ lat: a.lat, lng: a.lng }, start, end).t -
      projectOntoRoute({ lat: b.lat, lng: b.lng }, start, end).t,
  );
}

function buildRouteStats(
  start: LatLng,
  destination: GeocodedDestination,
  recommendations: PlaceResult[],
  totalDistanceMeters: number,
  healthOptimised: boolean,
  maxWalkMinutes: number = MAX_WALK_MINUTES,
): RouteStats {
  const directDistanceMeters = haversineMeters(start, destination);
  const directDurationMinutes = estimateWalkMinutes(directDistanceMeters);
  const estimatedDurationMinutes = estimateWalkMinutes(totalDistanceMeters);
  const estimatedSteps = estimateSteps(totalDistanceMeters);
  const directSteps = estimateSteps(directDistanceMeters);

  return {
    healthOptimised,
    directDistanceMeters,
    directDurationMinutes,
    estimatedDurationMinutes,
    estimatedSteps,
    extraStepsVsDirect: Math.max(0, estimatedSteps - directSteps),
    withinHourCap: estimatedDurationMinutes <= maxWalkMinutes,
  };
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
  destinationQuery: string,
  start: LatLng & { name?: string },
  destination: GeocodedDestination,
  preferences: UserPreferences,
  options?: { healthOptimisedRoute?: boolean },
): Promise<TripPlan> {
  const healthOptimised =
    options?.healthOptimisedRoute ?? isHealthOptimisedMode(preferences.details);
  const maxWalkMinutes =
    preferences.details?.timeBudget === "45" ? 45 : MAX_WALK_MINUTES;
  const mode = getJourneyMode(preferences.details);
  const radius = Math.min(
    getSearchRadiusMeters(preferences.healthGoal, preferences.details),
    50_000,
  );
  const directMeters = haversineMeters(start, destination);
  let maxStops = Math.max(
    1,
    MAX_STOPS_BY_HEALTH[preferences.healthGoal] + getModeRouteStopsOffset(mode),
  );
  let maxDetourMeters = radius * getModeDetourMultiplier(mode);
  let sampleCount = mode === "social" ? 5 : 3;

  if (healthOptimised) {
    maxStops += 4;
    maxDetourMeters *= 1.15;
    sampleCount = 6;
  }

  const samplePoints = sampleRoutePoints(start, destination, sampleCount);

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

  const allPlaces = placeBatches.flat();
  const recommendations = healthOptimised
    ? selectHealthOptimisedStops(
        start,
        destination,
        allPlaces,
        maxDetourMeters,
        directMeters,
        maxWalkMinutes,
      )
    : selectPlacesAlongRoute(
        start,
        destination,
        allPlaces,
        maxStops,
        maxDetourMeters,
      );

  const stops = buildStops(start, destination, recommendations);
  const routePath = buildRoutePath(stops);
  const totalDistanceMeters = stops.reduce(
    (sum, stop) => sum + (stop.distanceFromPreviousMeters ?? 0),
    0,
  );
  const routeStats = buildRouteStats(
    start,
    destination,
    recommendations,
    totalDistanceMeters,
    healthOptimised,
    maxWalkMinutes,
  );

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    destinationQuery,
    destination,
    start,
    stops,
    routePath,
    totalDistanceMeters,
    routeStats,
  };
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(meters)} m`;
}
