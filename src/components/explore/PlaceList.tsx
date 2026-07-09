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
      <div className="brand-card p-6 text-center text-sm text-muted">
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
              className={`brand-card w-full p-4 text-left ${
                selected ? "brand-card-selected" : "hover:border-muted"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-foreground text-xs font-medium text-background">
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-medium text-foreground">
                    {place.name}
                  </span>
                  {place.address && (
                    <span className="text-sm text-muted">
                      {place.address}
                    </span>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {place.rating !== undefined && (
                      <span className="text-sm text-muted">
                        ★ {place.rating.toFixed(1)}
                      </span>
                    )}
                    {place.distanceMeters !== undefined && (
                      <span className="text-sm text-muted">
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
                      className="brand-link text-sm"
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
