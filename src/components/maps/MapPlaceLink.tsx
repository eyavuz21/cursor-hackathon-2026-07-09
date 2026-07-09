import { getGoogleMapsUrl } from "@/lib/google-maps-url";

type MapPlaceLinkProps = {
  name: string;
  lat: number;
  lng: number;
  googleMapsUri?: string;
  selected?: boolean;
  onSelect?: () => void;
};

export function MapPlaceLink({
  name,
  lat,
  lng,
  googleMapsUri,
  selected = false,
  onSelect,
}: MapPlaceLinkProps) {
  const mapsUrl = getGoogleMapsUrl({ googleMapsUri, lat, lng, name });

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
      className={`block max-w-[180px] truncate border px-2 py-1 text-xs font-medium shadow-md transition-colors ${
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-white bg-background text-foreground hover:bg-accent-subtle"
      }`}
      title={`Open ${name} in Google Maps`}
    >
      {name}
    </a>
  );
}
