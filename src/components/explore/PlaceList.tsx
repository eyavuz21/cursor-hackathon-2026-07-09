import type { PlaceResult } from "@/lib/types";

type PlaceListProps = {
  places: PlaceResult[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
};

export function PlaceList({
  places,
  selectedPlaceId,
  onSelectPlace,
}: PlaceListProps) {
  if (places.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        No 4.5+ star places matched your interests within your search radius.
        Try picking more interests or a wider walk radius.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {places.map((place, index) => {
        const selected = selectedPlaceId === place.id;
        const mapsUrl =
          place.googleMapsUri ??
          `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

        return (
          <li key={place.id} id={`place-${place.id}`}>
            <button
              type="button"
              onClick={() => onSelectPlace(place.id)}
              className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                selected
                  ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {place.name}
                  </span>
                  {place.address && (
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {place.address}
                    </span>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {place.rating !== undefined && (
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        ★ {place.rating.toFixed(1)}
                      </span>
                    )}
                    {place.distanceMeters !== undefined && (
                      <span className="text-sm text-zinc-500 dark:text-zinc-500">
                        {place.distanceMeters >= 1000
                          ? `${(place.distanceMeters / 1000).toFixed(1)} km away`
                          : `${place.distanceMeters} m away`}
                      </span>
                    )}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
