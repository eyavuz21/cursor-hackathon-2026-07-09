import { formatDistance } from "@/lib/route";
import type { JournalStop } from "@/lib/types";

type JournalTimelineProps = {
  stops: JournalStop[];
  selectedStopId: string | null;
  onSelectStop: (stopId: string) => void;
};

function stopLabel(type: JournalStop["type"]): string {
  switch (type) {
    case "start":
      return "Depart";
    case "destination":
      return "Arrive";
    default:
      return "Stop";
  }
}

export function JournalTimeline({
  stops,
  selectedStopId,
  onSelectStop,
}: JournalTimelineProps) {
  let recommendationIndex = 0;

  return (
    <ol className="flex flex-col gap-0">
      {stops.map((stop, index) => {
        const isLast = index === stops.length - 1;
        const selected = selectedStopId === stop.id;
        const mapsUrl =
          stop.googleMapsUri ??
          `https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`;

        if (stop.type === "recommendation") {
          recommendationIndex += 1;
        }

        return (
          <li key={stop.id} id={`journal-stop-${stop.id}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onSelectStop(stop.id)}
                className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 text-xs font-medium transition-colors ${
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : stop.type === "start"
                      ? "border-foreground bg-foreground text-background"
                      : stop.type === "destination"
                        ? "border-muted bg-muted text-background"
                        : "border-foreground bg-foreground text-background"
                }`}
              >
                {stop.type === "recommendation" ? recommendationIndex : "•"}
              </button>
              {!isLast && (
                <span className="my-1 w-px flex-1 bg-border" />
              )}
            </div>

            <button
              type="button"
              onClick={() => onSelectStop(stop.id)}
              className={`brand-card mb-4 flex-1 p-4 text-left ${
                selected ? "brand-card-selected" : "hover:border-muted"
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="brand-label">
                    {stopLabel(stop.type)}
                  </span>
                  {stop.distanceFromPreviousMeters !== undefined && (
                    <span className="border border-border px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted">
                      +{formatDistance(stop.distanceFromPreviousMeters)}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-foreground">
                  {stop.name}
                </h3>
                {stop.address && stop.type !== "start" && (
                  <p className="text-sm text-muted">
                    {stop.address}
                  </p>
                )}
                {stop.type === "recommendation" && (
                  <div className="flex flex-wrap items-center gap-3">
                    {stop.rating !== undefined && (
                      <span className="text-sm text-muted">
                        ★ {stop.rating.toFixed(1)}
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
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
