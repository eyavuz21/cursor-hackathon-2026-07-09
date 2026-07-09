import type { LatLng } from "@/lib/types";

type WalkingRouteResult = {
  path: LatLng[];
  legDistancesMeters: number[];
  totalDistanceMeters: number;
};

export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

function toRouteLocation(point: LatLng) {
  return {
    location: {
      latLng: {
        latitude: point.lat,
        longitude: point.lng,
      },
    },
  };
}

export async function fetchWalkingRoute(
  apiKey: string,
  waypoints: LatLng[],
): Promise<WalkingRouteResult> {
  if (waypoints.length < 2) {
    throw new Error("At least two waypoints are required for a walking route.");
  }

  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const intermediates = waypoints.slice(1, -1).map(toRouteLocation);

  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.polyline.encodedPolyline,routes.distanceMeters,routes.legs.distanceMeters",
      },
      body: JSON.stringify({
        origin: toRouteLocation(origin),
        destination: toRouteLocation(destination),
        intermediates,
        travelMode: "WALK",
        computeAlternativeRoutes: false,
      }),
    },
  );

  const data = (await response.json()) as {
    routes?: Array<{
      polyline?: { encodedPolyline?: string };
      distanceMeters?: number;
      legs?: Array<{ distanceMeters?: number }>;
    }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Could not fetch walking directions.");
  }

  const route = data.routes?.[0];
  const encoded = route?.polyline?.encodedPolyline;

  if (!encoded) {
    throw new Error("Walking route did not include a path.");
  }

  return {
    path: decodePolyline(encoded),
    legDistancesMeters: (route.legs ?? []).map(
      (leg) => leg.distanceMeters ?? 0,
    ),
    totalDistanceMeters: route.distanceMeters ?? 0,
  };
}
