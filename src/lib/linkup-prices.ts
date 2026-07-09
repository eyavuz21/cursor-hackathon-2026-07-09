import type { Supermarket } from "@/lib/osm-shops";
import type { ParkingLot } from "@/lib/osm-parking";
import type { LiveParkingPriceInput, ParkingPriceQuote } from "@/lib/parking";

const USER_AGENT = "Wander/1.0 (hackathon; parkandsave-integration)";
const LINKUP_SEARCH_URL = "https://api.linkup.so/v1/search";

export type ItemPriceQuote = {
  item: string;
  shopName: string;
  shopId: string | null;
  priceGbp: number;
  note?: string;
};

export type LivePriceResult = {
  quotes: ItemPriceQuote[];
  basketWinnerShopId: string | null;
  basketWinnerShopName: string | null;
  summary: string | null;
  sources: Array<{ name: string; url: string }>;
};

type LinkUpSourcedAnswer = {
  answer: string;
  sources: Array<{ name: string; url: string }>;
};

export function isLinkUpConfigured(): boolean {
  return Boolean(process.env.LINKUP_API_KEY?.trim());
}

async function linkupSearch<T>(body: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.LINKUP_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("LINKUP_API_KEY is not configured.");
  }

  const response = await fetch(LINKUP_SEARCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    error?: { message?: string };
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.error?.message ?? data.message ?? "LinkUp search request failed.",
    );
  }

  return data;
}

export async function reverseGeocodeLabel(
  lat: number,
  lng: number,
): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    const data = (await response.json()) as {
      display_name?: string;
      address?: { suburb?: string; city?: string; town?: string };
    };

    if (data.display_name) {
      return data.display_name.split(",").slice(0, 3).join(",").trim();
    }

    const locality =
      data.address?.suburb ?? data.address?.city ?? data.address?.town;
    return locality ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function matchShopByName(
  shops: Supermarket[],
  candidate: string,
): Supermarket | null {
  const normalizedCandidate = normalizeName(candidate);
  if (!normalizedCandidate) return null;

  let best: Supermarket | null = null;
  let bestScore = 0;

  for (const shop of shops) {
    const names = [shop.name, shop.brand].filter(Boolean) as string[];
    for (const name of names) {
      const normalizedShop = normalizeName(name);
      if (!normalizedShop) continue;

      if (
        normalizedShop === normalizedCandidate ||
        normalizedShop.includes(normalizedCandidate) ||
        normalizedCandidate.includes(normalizedShop)
      ) {
        return shop;
      }

      const overlap = normalizedCandidate
        .split(" ")
        .filter((token) => token.length > 2 && normalizedShop.includes(token))
        .length;

      if (overlap > bestScore) {
        bestScore = overlap;
        best = shop;
      }
    }
  }

  return bestScore > 0 ? best : null;
}

type StructuredPricePayload = {
  itemPrices?: Array<{
    item?: string;
    shop?: string;
    priceGbp?: number;
    note?: string;
  }>;
  basketWinner?: string;
  summary?: string;
};

const PRICE_SCHEMA = {
  type: "object",
  properties: {
    itemPrices: {
      type: "array",
      description: "Per-item price quotes at specific supermarkets",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          shop: { type: "string" },
          priceGbp: { type: "number" },
          note: { type: "string" },
        },
        required: ["item", "shop", "priceGbp"],
      },
    },
    basketWinner: {
      type: "string",
      description: "Supermarket with the lowest total basket price",
    },
    summary: {
      type: "string",
      description: "One sentence summary of the cheapest options",
    },
  },
  required: ["itemPrices", "basketWinner", "summary"],
};

function parsePricePayload(
  payload: StructuredPricePayload,
  shops: Supermarket[],
): LivePriceResult {
  const quotes: ItemPriceQuote[] = [];

  for (const entry of payload.itemPrices ?? []) {
    if (!entry.item || !entry.shop || typeof entry.priceGbp !== "number") {
      continue;
    }

    const matchedShop = matchShopByName(shops, entry.shop);
    quotes.push({
      item: entry.item,
      shopName: matchedShop?.name ?? entry.shop,
      shopId: matchedShop?.id ?? null,
      priceGbp: entry.priceGbp,
      note: entry.note,
    });
  }

  const basketWinnerShop = payload.basketWinner
    ? matchShopByName(shops, payload.basketWinner)
    : null;

  return {
    quotes,
    basketWinnerShopId: basketWinnerShop?.id ?? null,
    basketWinnerShopName: basketWinnerShop?.name ?? payload.basketWinner ?? null,
    summary: payload.summary ?? null,
    sources: [],
  };
}

function parseSourcedAnswer(
  answer: string,
  items: string[],
  shops: Supermarket[],
): LivePriceResult {
  const quotes: ItemPriceQuote[] = [];
  const lines = answer.split(/\n+/);

  for (const line of lines) {
    const priceMatch = line.match(/£\s?(\d+(?:\.\d{2})?)/);
    if (!priceMatch) continue;

    const priceGbp = Number.parseFloat(priceMatch[1]);
    const item =
      items.find((candidate) =>
        line.toLowerCase().includes(candidate.toLowerCase()),
      ) ?? null;

    if (!item) continue;

    const shop =
      shops.find(
        (candidate) =>
          line.toLowerCase().includes(candidate.name.toLowerCase()) ||
          (candidate.brand &&
            line.toLowerCase().includes(candidate.brand.toLowerCase())),
      ) ?? null;

    if (!shop) continue;

    quotes.push({
      item,
      shopName: shop.name,
      shopId: shop.id,
      priceGbp,
      note: line.trim(),
    });
  }

  return {
    quotes,
    basketWinnerShopId: null,
    basketWinnerShopName: null,
    summary: answer,
    sources: [],
  };
}

export async function fetchLiveBasketPrices(input: {
  items: string[];
  shops: Supermarket[];
  lat: number;
  lng: number;
}): Promise<LivePriceResult | null> {
  if (!isLinkUpConfigured() || input.shops.length === 0 || input.items.length === 0) {
    return null;
  }

  const locationLabel = await reverseGeocodeLabel(input.lat, input.lng);
  const shopNames = input.shops
    .slice(0, 6)
    .map((shop) => shop.brand ?? shop.name)
    .join(", ");
  const itemList = input.items.join(", ");

  const query = `Find current UK grocery prices for this shopping list near ${locationLabel}: ${itemList}.
Compare these nearby supermarkets: ${shopNames}.
Return the cheapest shop for each item and which shop is cheapest for the full basket together.
Use recent web prices in GBP.`;

  try {
    const structured = await linkupSearch<StructuredPricePayload>({
      q: query,
      depth: "standard",
      outputType: "structured",
      structuredOutputSchema: PRICE_SCHEMA,
    });

    const parsed = parsePricePayload(structured, input.shops);
    if (parsed.quotes.length > 0) {
      return parsed;
    }
  } catch {
    // Fall through to sourced answer.
  }

  try {
    const sourced = await linkupSearch<LinkUpSourcedAnswer>({
      q: query,
      depth: "standard",
      outputType: "sourcedAnswer",
    });

    const parsed = parseSourcedAnswer(sourced.answer, input.items, input.shops);
    parsed.sources = (sourced.sources ?? []).slice(0, 5).map((source) => ({
      name: source.name,
      url: source.url,
    }));

    return parsed.quotes.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function matchParkingByName(
  lots: ParkingLot[],
  candidate: string,
): ParkingLot | null {
  const normalizedCandidate = normalizeName(candidate);
  if (!normalizedCandidate) return null;

  let best: ParkingLot | null = null;
  let bestScore = 0;

  for (const lot of lots) {
    const names = [lot.name, lot.operator].filter(Boolean) as string[];
    for (const name of names) {
      const normalizedLot = normalizeName(name);
      if (!normalizedLot) continue;

      if (
        normalizedLot === normalizedCandidate ||
        normalizedLot.includes(normalizedCandidate) ||
        normalizedCandidate.includes(normalizedLot)
      ) {
        return lot;
      }

      const overlap = normalizedCandidate
        .split(" ")
        .filter((token) => token.length > 2 && normalizedLot.includes(token))
        .length;

      if (overlap > bestScore) {
        bestScore = overlap;
        best = lot;
      }
    }
  }

  return bestScore > 0 ? best : null;
}

type StructuredParkingPayload = {
  parkingPrices?: Array<{
    carPark?: string;
    priceGbpPerHour?: number;
    note?: string;
  }>;
  cheapestCarPark?: string;
  summary?: string;
};

const PARKING_SCHEMA = {
  type: "object",
  properties: {
    parkingPrices: {
      type: "array",
      description: "Hourly parking prices at specific car parks",
      items: {
        type: "object",
        properties: {
          carPark: { type: "string" },
          priceGbpPerHour: { type: "number" },
          note: { type: "string" },
        },
        required: ["carPark", "priceGbpPerHour"],
      },
    },
    cheapestCarPark: {
      type: "string",
      description: "Car park with the lowest hourly rate",
    },
    summary: {
      type: "string",
      description: "One sentence summary of the cheapest parking options",
    },
  },
  required: ["parkingPrices", "cheapestCarPark", "summary"],
};

function parseParkingPayload(
  payload: StructuredParkingPayload,
  lots: ParkingLot[],
): LiveParkingPriceInput {
  const quotes: ParkingPriceQuote[] = [];

  for (const entry of payload.parkingPrices ?? []) {
    if (!entry.carPark || typeof entry.priceGbpPerHour !== "number") {
      continue;
    }

    const matchedLot = matchParkingByName(lots, entry.carPark);
    quotes.push({
      lotName: matchedLot?.name ?? entry.carPark,
      lotId: matchedLot?.id ?? null,
      priceGbpPerHour: entry.priceGbpPerHour,
      note: entry.note,
    });
  }

  const cheapestLot = payload.cheapestCarPark
    ? matchParkingByName(lots, payload.cheapestCarPark)
    : null;

  return {
    quotes,
    cheapestLotId: cheapestLot?.id ?? null,
    cheapestLotName: cheapestLot?.name ?? payload.cheapestCarPark ?? null,
    summary: payload.summary ?? null,
    sources: [],
  };
}

function parseParkingSourcedAnswer(
  answer: string,
  lots: ParkingLot[],
): LiveParkingPriceInput {
  const quotes: ParkingPriceQuote[] = [];
  const lines = answer.split(/\n+/);

  for (const line of lines) {
    const priceMatch = line.match(/£\s?(\d+(?:\.\d{2})?)/);
    if (!priceMatch) continue;

    const priceGbpPerHour = Number.parseFloat(priceMatch[1]);
    const lot =
      lots.find(
        (candidate) =>
          line.toLowerCase().includes(candidate.name.toLowerCase()) ||
          (candidate.operator &&
            line.toLowerCase().includes(candidate.operator.toLowerCase())),
      ) ?? null;

    if (!lot) continue;

    quotes.push({
      lotName: lot.name,
      lotId: lot.id,
      priceGbpPerHour,
      note: line.trim(),
    });
  }

  return {
    quotes,
    cheapestLotId: null,
    cheapestLotName: null,
    summary: answer,
    sources: [],
  };
}

export async function fetchLiveParkingPrices(input: {
  lots: ParkingLot[];
  lat: number;
  lng: number;
  destinationLabel?: string;
}): Promise<LiveParkingPriceInput | null> {
  if (!isLinkUpConfigured() || input.lots.length === 0) {
    return null;
  }

  const locationLabel =
    input.destinationLabel ?? (await reverseGeocodeLabel(input.lat, input.lng));
  const lotNames = input.lots
    .slice(0, 8)
    .map((lot) => lot.name)
    .join(", ");

  const query = `Find current UK car park hourly prices near ${locationLabel}.
Compare these nearby car parks: ${lotNames}.
Return the hourly rate in GBP for each car park and which is cheapest.
Include NCP, Q-Park, council, and commercial car parks where possible.`;

  try {
    const structured = await linkupSearch<StructuredParkingPayload>({
      q: query,
      depth: "standard",
      outputType: "structured",
      structuredOutputSchema: PARKING_SCHEMA,
    });

    const parsed = parseParkingPayload(structured, input.lots);
    if (parsed.quotes.length > 0) {
      return parsed;
    }
  } catch {
    // Fall through to sourced answer.
  }

  try {
    const sourced = await linkupSearch<LinkUpSourcedAnswer>({
      q: query,
      depth: "standard",
      outputType: "sourcedAnswer",
    });

    const parsed = parseParkingSourcedAnswer(sourced.answer, input.lots);
    parsed.sources = (sourced.sources ?? []).slice(0, 5).map((source) => ({
      name: source.name,
      url: source.url,
    }));

    return parsed.quotes.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}
