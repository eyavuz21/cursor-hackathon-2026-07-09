import type { PlaceResult } from "@/lib/types";

const AUTO_DESTINATION_ID = "__auto__";

type DestinationPickerProps = {
  places: PlaceResult[];
  value: string | null;
  onChange: (placeId: string | null) => void;
  disabled?: boolean;
};

function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km away`
    : `${meters} m away`;
}

export function DestinationPicker({
  places,
  value,
  onChange,
  disabled = false,
}: DestinationPickerProps) {
  const selectedId = value ?? AUTO_DESTINATION_ID;

  if (places.length === 0) {
    return (
      <p className="text-sm text-muted">
        No suggestions available yet. Pick places on the map above.
      </p>
    );
  }

  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-1 text-sm font-medium text-foreground">
        Where do you want to go?
      </legend>

      <label
        className={`brand-card flex cursor-pointer items-start gap-3 p-4 ${
          selectedId === AUTO_DESTINATION_ID ? "brand-card-selected" : ""
        }`}
      >
        <input
          type="radio"
          name="destination"
          value={AUTO_DESTINATION_ID}
          checked={selectedId === AUTO_DESTINATION_ID}
          onChange={() => onChange(null)}
          className="mt-1 accent-foreground"
        />
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">
            Best route through all my picks
          </span>
          <span className="text-sm text-muted">
            We&apos;ll order your {places.length} suggestions into the shortest
            walking route.
          </span>
        </div>
      </label>

      {places.map((place) => (
        <label
          key={place.id}
          className={`brand-card flex cursor-pointer items-start gap-3 p-4 ${
            selectedId === place.id ? "brand-card-selected" : ""
          }`}
        >
          <input
            type="radio"
            name="destination"
            value={place.id}
            checked={selectedId === place.id}
            onChange={() => onChange(place.id)}
            className="mt-1 accent-foreground"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-medium text-foreground">{place.name}</span>
            {place.address && (
              <span className="text-sm text-muted">{place.address}</span>
            )}
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted">
              {place.rating !== undefined && (
                <span>★ {place.rating.toFixed(1)}</span>
              )}
              {place.distanceMeters !== undefined && (
                <span>{formatDistance(place.distanceMeters)}</span>
              )}
            </div>
          </div>
        </label>
      ))}
    </fieldset>
  );
}
