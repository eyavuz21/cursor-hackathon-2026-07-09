type MapsPoint = {
  lat: number;
  lng: number;
  name?: string;
  placeId?: string;
  googleMapsUri?: string;
};

export function getGoogleMapsUrl(options: MapsPoint): string {
  if (options.googleMapsUri) {
    return options.googleMapsUri;
  }

  if (options.placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(options.name ?? "")}&query_place_id=${options.placeId}`;
  }

  if (options.name && options.name !== "Your location") {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(options.name)}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${options.lat},${options.lng}`;
}

function formatDirectionsPoint(point: MapsPoint): string {
  if (point.placeId) {
    return `place_id:${point.placeId}`;
  }

  if (point.name && point.name !== "Your location") {
    return point.name;
  }

  return `${point.lat},${point.lng}`;
}

export function buildWalkingDirectionsUrl(stops: MapsPoint[]): string {
  if (stops.length < 2) {
    const only = stops[0];
    return only ? getGoogleMapsUrl(only) : "https://www.google.com/maps";
  }

  const origin = formatDirectionsPoint(stops[0]);
  const destination = formatDirectionsPoint(stops[stops.length - 1]);
  const waypoints = stops
    .slice(1, -1)
    .map((stop) => formatDirectionsPoint(stop))
    .join("|");

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "walking",
  });

  if (waypoints) {
    params.set("waypoints", waypoints);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
