const USER_AGENT = "Wander/1.0 (hackathon; contact@example.com)";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

export type Supermarket = {
  id: string;
  name: string;
  brand?: string;
  lat: number;
  lng: number;
  distanceMeters: number;
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

function parseOverpassElements(
  elements: OverpassElement[],
  originLat: number,
  originLng: number,
): Supermarket[] {
  const seen = new Set<string>();
  const shops: Supermarket[] = [];

  for (const element of elements) {
    const shopLat = element.lat ?? element.center?.lat;
    const shopLng = element.lon ?? element.center?.lon;
    const name = element.tags?.name ?? element.tags?.brand;

    if (shopLat == null || shopLng == null || !name) continue;

    const key = `${name}-${shopLat.toFixed(5)}-${shopLng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    shops.push({
      id: `osm-${element.id}`,
      name,
      brand: element.tags?.brand,
      lat: shopLat,
      lng: shopLng,
      distanceMeters: haversineMeters(originLat, originLng, shopLat, shopLng),
    });
  }

  return shops.sort((a, b) => a.distanceMeters - b.distanceMeters);
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

export async function findNearbySupermarkets(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<Supermarket[]> {
  const radius = Math.min(Math.max(Math.round(radiusMeters), 200), 5_000);
  const query = `[out:json][timeout:25];(node["shop"="supermarket"](around:${radius},${lat},${lng});way["shop"="supermarket"](around:${radius},${lat},${lng}););out center 25;`;

  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const elements = await queryOverpass(endpoint, query);
      const shops = parseOverpassElements(elements, lat, lng);
      if (shops.length > 0) {
        return shops;
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

export async function findSupermarketsAlongCorridor(
  points: Array<{ lat: number; lng: number }>,
  radiusMeters: number,
): Promise<Supermarket[]> {
  const batches = await Promise.all(
    points.map((point) =>
      findNearbySupermarkets(point.lat, point.lng, radiusMeters).catch(() => []),
    ),
  );

  const byId = new Map<string, Supermarket>();
  for (const batch of batches) {
    for (const shop of batch) {
      const existing = byId.get(shop.id);
      if (!existing || shop.distanceMeters < existing.distanceMeters) {
        byId.set(shop.id, shop);
      }
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => a.distanceMeters - b.distanceMeters,
  );
}
