import { haversineMeters } from "@/lib/route";
import type { Supermarket } from "@/lib/osm-shops";
import type { LatLng } from "@/lib/types";

export type ShoppingMode = "scavenger" | "efficiency";

export type ShopPlanStop = {
  shop: Supermarket;
  items: string[];
  detourMeters: number;
};

export type ShopPlan = {
  mode: ShoppingMode;
  items: string[];
  stops: ShopPlanStop[];
  uncoveredItems: string[];
  totalDetourMeters: number;
};

export function parseShoppingList(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

export function sampleCorridorPoints(
  start: LatLng,
  destination?: LatLng,
): LatLng[] {
  if (!destination) return [start];

  return [0, 0.33, 0.66, 1].map((t) => interpolate(start, destination, t));
}

function distanceToSegmentMeters(
  point: LatLng,
  start: LatLng,
  end: LatLng,
): number {
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return haversineMeters(point, start);
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
  return haversineMeters(point, projected);
}

function shopsAlongCorridor(
  shops: Supermarket[],
  start: LatLng,
  destination?: LatLng,
): Supermarket[] {
  if (!destination) return shops;

  return shops
    .map((shop) => ({
      shop,
      corridorDistance: distanceToSegmentMeters(
        { lat: shop.lat, lng: shop.lng },
        start,
        destination,
      ),
    }))
    .filter((entry) => entry.corridorDistance <= 800)
    .sort((a, b) => a.corridorDistance - b.corridorDistance)
    .map((entry) => entry.shop);
}

function nearestShop(
  shops: Supermarket[],
  anchor: LatLng,
  excludeIds: Set<string> = new Set(),
): Supermarket | null {
  let best: Supermarket | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const shop of shops) {
    if (excludeIds.has(shop.id)) continue;

    const distance = haversineMeters(anchor, { lat: shop.lat, lng: shop.lng });
    if (distance < bestDistance) {
      bestDistance = distance;
      best = shop;
    }
  }

  return best;
}

function buildScavengerPlan(
  items: string[],
  shops: Supermarket[],
  start: LatLng,
  destination?: LatLng,
): ShopPlan {
  const corridorShops =
    shopsAlongCorridor(shops, start, destination).length > 0
      ? shopsAlongCorridor(shops, start, destination)
      : shops;

  const stopsByShop = new Map<string, ShopPlanStop>();
  const uncoveredItems: string[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const progress = items.length === 1 ? 0.5 : index / (items.length - 1);
    const itemAnchor = destination
      ? interpolate(start, destination, progress)
      : start;

    const usedShopIds = new Set(stopsByShop.keys());
    const shop =
      nearestShop(corridorShops, itemAnchor, usedShopIds) ??
      nearestShop(corridorShops, itemAnchor) ??
      nearestShop(shops, start);

    if (!shop) {
      uncoveredItems.push(item);
      continue;
    }

    const existing = stopsByShop.get(shop.id);
    if (existing) {
      existing.items.push(item);
      continue;
    }

    stopsByShop.set(shop.id, {
      shop,
      items: [item],
      detourMeters: destination
        ? distanceToSegmentMeters({ lat: shop.lat, lng: shop.lng }, start, destination)
        : shop.distanceMeters,
    });
  }

  const stops = Array.from(stopsByShop.values()).sort(
    (a, b) => a.detourMeters - b.detourMeters,
  );

  return {
    mode: "scavenger",
    items,
    stops,
    uncoveredItems,
    totalDetourMeters: stops.reduce((sum, stop) => sum + stop.detourMeters, 0),
  };
}

function buildEfficiencyPlan(
  items: string[],
  shops: Supermarket[],
  start: LatLng,
  destination?: LatLng,
): ShopPlan {
  const corridorShops =
    shopsAlongCorridor(shops, start, destination).length > 0
      ? shopsAlongCorridor(shops, start, destination)
      : shops;

  const candidates = corridorShops.length > 0 ? corridorShops : shops;
  const anchor = destination ?? start;

  let bestShop: Supermarket | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const shop of candidates) {
    const toAnchor = haversineMeters(anchor, { lat: shop.lat, lng: shop.lng });
    const toStart = haversineMeters(start, { lat: shop.lat, lng: shop.lng });
    const score = -(destination ? toAnchor : toStart);

    if (score > bestScore) {
      bestScore = score;
      bestShop = shop;
    }
  }

  if (!bestShop) {
    return {
      mode: "efficiency",
      items,
      stops: [],
      uncoveredItems: items,
      totalDetourMeters: 0,
    };
  }

  const detourMeters = destination
    ? distanceToSegmentMeters({ lat: bestShop.lat, lng: bestShop.lng }, start, destination)
    : bestShop.distanceMeters;

  return {
    mode: "efficiency",
    items,
    stops: [
      {
        shop: bestShop,
        items,
        detourMeters,
      },
    ],
    uncoveredItems: [],
    totalDetourMeters: detourMeters,
  };
}

export function buildShopPlan(input: {
  mode: ShoppingMode;
  items: string[];
  shops: Supermarket[];
  start: LatLng;
  destination?: LatLng;
}): ShopPlan {
  const { mode, items, shops, start, destination } = input;

  if (items.length === 0) {
    return {
      mode,
      items: [],
      stops: [],
      uncoveredItems: [],
      totalDetourMeters: 0,
    };
  }

  if (shops.length === 0) {
    return {
      mode,
      items,
      stops: [],
      uncoveredItems: items,
      totalDetourMeters: 0,
    };
  }

  if (mode === "efficiency") {
    return buildEfficiencyPlan(items, shops, start, destination);
  }

  return buildScavengerPlan(items, shops, start, destination);
}

export function formatDetour(meters: number): string {
  if (meters >= 1000) {
    return `~${(meters / 1000).toFixed(1)} km detour`;
  }

  return `~${Math.round(meters)} m detour`;
}
