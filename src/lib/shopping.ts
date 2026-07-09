import { haversineMeters } from "@/lib/route";
import type { Supermarket } from "@/lib/osm-shops";
import type { LatLng } from "@/lib/types";

export type ShoppingMode = "scavenger" | "efficiency";

export type PriceQuote = {
  item: string;
  shopId: string | null;
  shopName: string;
  priceGbp: number;
};

export type LivePriceInput = {
  quotes: PriceQuote[];
  basketWinnerShopId: string | null;
  basketWinnerShopName: string | null;
  summary: string | null;
  sources: Array<{ name: string; url: string }>;
};

export type ShopPlanStop = {
  shop: Supermarket;
  items: string[];
  detourMeters: number;
  itemPrices?: Record<string, number>;
  estimatedTotalGbp?: number;
};

export type ShopPlan = {
  mode: ShoppingMode;
  items: string[];
  stops: ShopPlanStop[];
  uncoveredItems: string[];
  totalDetourMeters: number;
  priceSource?: "linkup" | "distance";
  priceSummary?: string | null;
  priceSources?: Array<{ name: string; url: string }>;
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

function cheapestQuotePerItem(
  quotes: PriceQuote[],
  items: string[],
): Map<string, PriceQuote> {
  const byItem = new Map<string, PriceQuote>();

  for (const item of items) {
    const normalizedItem = item.toLowerCase();
    const candidates = quotes.filter(
      (quote) =>
        quote.item.toLowerCase() === normalizedItem ||
        quote.item.toLowerCase().includes(normalizedItem) ||
        normalizedItem.includes(quote.item.toLowerCase()),
    );

    if (candidates.length === 0) continue;

    const cheapest = candidates.reduce((best, current) =>
      current.priceGbp < best.priceGbp ? current : best,
    );

    byItem.set(item, cheapest);
  }

  return byItem;
}

function totalBasketPrice(
  quotes: PriceQuote[],
  shopId: string,
  items: string[],
): number | null {
  let total = 0;
  let matched = 0;

  for (const item of items) {
    const quote = quotes.find(
      (entry) =>
        entry.shopId === shopId && entry.item.toLowerCase() === item.toLowerCase(),
    );

    if (!quote) continue;
    total += quote.priceGbp;
    matched += 1;
  }

  return matched > 0 ? total : null;
}

function attachPricesToStop(
  stop: ShopPlanStop,
  quotes: PriceQuote[],
): ShopPlanStop {
  const itemPrices: Record<string, number> = {};

  for (const item of stop.items) {
    const quote = quotes.find(
      (entry) =>
        entry.shopId === stop.shop.id &&
        entry.item.toLowerCase() === item.toLowerCase(),
    );
    if (quote) {
      itemPrices[item] = quote.priceGbp;
    }
  }

  const pricedValues = Object.values(itemPrices);
  const estimatedTotalGbp =
    pricedValues.length > 0
      ? pricedValues.reduce((sum, value) => sum + value, 0)
      : undefined;

  return {
    ...stop,
    itemPrices: pricedValues.length > 0 ? itemPrices : undefined,
    estimatedTotalGbp,
  };
}

function buildScavengerPlanWithPrices(
  items: string[],
  shops: Supermarket[],
  start: LatLng,
  destination: LatLng | undefined,
  livePrices: LivePriceInput,
): ShopPlan {
  const corridorShops =
    shopsAlongCorridor(shops, start, destination).length > 0
      ? shopsAlongCorridor(shops, start, destination)
      : shops;
  const cheapestByItem = cheapestQuotePerItem(livePrices.quotes, items);
  const stopsByShop = new Map<string, ShopPlanStop>();
  const uncoveredItems: string[] = [];

  for (const item of items) {
    const quote = cheapestByItem.get(item);
    const shop =
      (quote?.shopId
        ? corridorShops.find((candidate) => candidate.id === quote.shopId)
        : null) ??
      (quote ? corridorShops.find((candidate) => candidate.name === quote.shopName) : null) ??
      nearestShop(corridorShops, destination ?? start);

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

  const stops = Array.from(stopsByShop.values())
    .sort((a, b) => a.detourMeters - b.detourMeters)
    .map((stop) => attachPricesToStop(stop, livePrices.quotes));

  return {
    mode: "scavenger",
    items,
    stops,
    uncoveredItems,
    totalDetourMeters: stops.reduce((sum, stop) => sum + stop.detourMeters, 0),
    priceSource: "linkup",
    priceSummary: livePrices.summary,
    priceSources: livePrices.sources,
  };
}

function buildEfficiencyPlanWithPrices(
  items: string[],
  shops: Supermarket[],
  start: LatLng,
  destination: LatLng | undefined,
  livePrices: LivePriceInput,
): ShopPlan {
  const corridorShops =
    shopsAlongCorridor(shops, start, destination).length > 0
      ? shopsAlongCorridor(shops, start, destination)
      : shops;
  const candidates = corridorShops.length > 0 ? corridorShops : shops;

  let bestShop =
    (livePrices.basketWinnerShopId
      ? candidates.find((shop) => shop.id === livePrices.basketWinnerShopId)
      : null) ??
    candidates.find((shop) => shop.name === livePrices.basketWinnerShopName) ??
    null;

  let bestTotal = bestShop
    ? totalBasketPrice(livePrices.quotes, bestShop.id, items)
    : null;

  if (!bestShop || bestTotal == null) {
    for (const shop of candidates) {
      const total = totalBasketPrice(livePrices.quotes, shop.id, items);
      if (total == null) continue;
      if (bestTotal == null || total < bestTotal) {
        bestTotal = total;
        bestShop = shop;
      }
    }
  }

  if (!bestShop) {
    return buildEfficiencyPlan(items, shops, start, destination);
  }

  const detourMeters = destination
    ? distanceToSegmentMeters({ lat: bestShop.lat, lng: bestShop.lng }, start, destination)
    : bestShop.distanceMeters;

  const stop = attachPricesToStop(
    {
      shop: bestShop,
      items,
      detourMeters,
    },
    livePrices.quotes,
  );

  return {
    mode: "efficiency",
    items,
    stops: [stop],
    uncoveredItems: [],
    totalDetourMeters: detourMeters,
    priceSource: "linkup",
    priceSummary: livePrices.summary,
    priceSources: livePrices.sources,
  };
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
  livePrices?: LivePriceInput | null;
}): ShopPlan {
  const { mode, items, shops, start, destination, livePrices } = input;

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

  if (livePrices && livePrices.quotes.length > 0) {
    if (mode === "efficiency") {
      return buildEfficiencyPlanWithPrices(
        items,
        shops,
        start,
        destination,
        livePrices,
      );
    }

    return buildScavengerPlanWithPrices(
      items,
      shops,
      start,
      destination,
      livePrices,
    );
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

export function formatPriceGbp(value: number): string {
  return `£${value.toFixed(2)}`;
}
