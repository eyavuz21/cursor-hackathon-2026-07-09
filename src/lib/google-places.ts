import type { GeocodedDestination } from "@/lib/types";

type GooglePlace = {
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
};

export async function geocodeDestination(
  apiKey: string,
  query: string,
  bias?: { lat: number; lng: number },
): Promise<GeocodedDestination | null> {
  const body: Record<string, unknown> = {
    textQuery: query,
    maxResultCount: 1,
  };

  if (bias) {
    body.locationBias = {
      circle: {
        center: { latitude: bias.lat, longitude: bias.lng },
        radius: 50_000,
      },
    };
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.location",
      },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as {
    places?: GooglePlace[];
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Could not find that destination.");
  }

  const place = data.places?.[0];
  if (!place) {
    return null;
  }

  const lat = place.location?.latitude;
  const lng = place.location?.longitude;

  if (lat === undefined || lng === undefined) {
    return null;
  }

  return {
    name: place.displayName?.text ?? query,
    address: place.formattedAddress ?? "",
    lat,
    lng,
  };
}
