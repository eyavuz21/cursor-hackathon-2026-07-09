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
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                  selected
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : stop.type === "start"
                      ? "border-blue-500 bg-blue-500 text-white"
                      : stop.type === "destination"
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                }`}
              >
                {stop.type === "recommendation" ? recommendationIndex : "•"}
              </button>
              {!isLast && (
                <span className="my-1 w-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              )}
            </div>

            <button
              type="button"
              onClick={() => onSelectStop(stop.id)}
              className={`mb-4 flex-1 rounded-2xl border p-4 text-left transition-colors ${
                selected
                  ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    {stopLabel(stop.type)}
                  </span>
                  {stop.distanceFromPreviousMeters !== undefined && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      +{formatDistance(stop.distanceFromPreviousMeters)}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                  {stop.name}
                </h3>
                {stop.address && stop.type !== "start" && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {stop.address}
                  </p>
                )}
                {stop.type === "recommendation" && (
                  <div className="flex flex-wrap items-center gap-3">
                    {stop.rating !== undefined && (
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        ★ {stop.rating.toFixed(1)}
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
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
