const USER_AGENT = "Wander/1.0 (hackathon; contact@example.com)";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

export type ParkingLot = {
  id: string;
  name: string;
  operator?: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  feeTag?: string;
  capacity?: number;
};

function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;

  return Math.round(2 * earthRadius * Math.asin(Math.sqrt(h)));
}

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function parkingName(tags: Record<string, string> | undefined): string | null {
  if (!tags) return null;

  return (
    tags.name ??
    tags["operator"] ??
    tags.brand ??
    (tags["amenity"] === "parking" ? "Car park" : null)
  );
}

function parseOverpassElements(
  elements: OverpassElement[],
  originLat: number,
  originLng: number,
): ParkingLot[] {
  const seen = new Set<string>();
  const lots: ParkingLot[] = [];

  for (const element of elements) {
    const lotLat = element.lat ?? element.center?.lat;
    const lotLng = element.lon ?? element.center?.lon;
    const name = parkingName(element.tags);

    if (lotLat == null || lotLng == null || !name) continue;

    const key = `${name}-${lotLat.toFixed(5)}-${lotLng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const capacity = element.tags?.capacity
      ? Number.parseInt(element.tags.capacity, 10)
      : undefined;

    lots.push({
      id: `osm-parking-${element.id}`,
      name,
      operator: element.tags?.operator,
      lat: lotLat,
      lng: lotLng,
      distanceMeters: haversineMeters(originLat, originLng, lotLat, lotLng),
      feeTag: element.tags?.fee,
      capacity: Number.isFinite(capacity) ? capacity : undefined,
    });
  }

  return lots.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

async function queryOverpass(
  endpoint: string,
  query: string,
): Promise<OverpassElement[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
      next: { revalidate: 300 },
    });

    const text = await response.text();

    if (!response.ok || text.trim().startsWith("<")) {
      throw new Error(`Overpass request failed at ${endpoint}`);
    }

    const data = JSON.parse(text) as { elements?: OverpassElement[] };
    return data.elements ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function findNearbyParking(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<ParkingLot[]> {
  const radius = Math.min(Math.max(Math.round(radiusMeters), 200), 3_000);
  const query = `[out:json][timeout:25];(node["amenity"="parking"](around:${radius},${lat},${lng});way["amenity"="parking"](around:${radius},${lat},${lng});node["parking"](around:${radius},${lat},${lng});way["parking"](around:${radius},${lat},${lng}););out center 20;`;

  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const elements = await queryOverpass(endpoint, query);
      const lots = parseOverpassElements(elements, lat, lng);
      if (lots.length > 0) {
        return lots;
      }
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Overpass lookup failed.");
    }
  }

  if (lastError) {
    throw lastError;
  }

  return [];
}

export async function findParkingAlongCorridor(
  points: Array<{ lat: number; lng: number }>,
  radiusMeters: number,
): Promise<ParkingLot[]> {
  const batches = await Promise.all(
    points.map((point) =>
      findNearbyParking(point.lat, point.lng, radiusMeters).catch(() => []),
    ),
  );

  const byId = new Map<string, ParkingLot>();
  for (const batch of batches) {
    for (const lot of batch) {
      const existing = byId.get(lot.id);
      if (!existing || lot.distanceMeters < existing.distanceMeters) {
        byId.set(lot.id, lot);
      }
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => a.distanceMeters - b.distanceMeters,
  );
}
