"use client";

import type { PlaceResult } from "@/lib/types";

type PlaceListProps = {
  places: PlaceResult[];
  selectedId?: string | null;
  onSelect?: (placeId: string) => void;
};

export function PlaceList({ places, selectedId, onSelect }: PlaceListProps) {
  if (places.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No places found nearby. Try starting over with different interests or a
          wider walking radius.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {places.map((place, index) => {
        const selected = selectedId === place.id;

        return (
          <li key={place.id}>
            <button
              type="button"
              onClick={() => onSelect?.(place.id)}
              className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                selected
                  ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                      {place.name}
                    </h3>
                    {place.rating !== undefined && (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                        ★ {place.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {place.address && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {place.address}
                    </p>
                  )}
                  {place.googleMapsUri && (
                    <a
                      href={place.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Open in Google Maps →
                    </a>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
