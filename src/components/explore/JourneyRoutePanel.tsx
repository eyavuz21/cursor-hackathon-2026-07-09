import { JournalTimeline } from "@/components/plan/JournalTimeline";
import { PlanMap } from "@/components/plan/PlanMap";
import { formatDistance } from "@/lib/route";
import { formatWalkDuration } from "@/lib/health-route";
import { buildWalkingDirectionsUrl } from "@/lib/google-maps-url";
import type { TripPlan } from "@/lib/types";

type JourneyRoutePanelProps = {
  plan: TripPlan;
  selectedStopId: string | null;
  onSelectStop: (stopId: string) => void;
  onSave: () => void;
  onEditPicks: () => void;
  savedMessage?: string | null;
};

export function JourneyRoutePanel({
  plan,
  selectedStopId,
  onSelectStop,
  onSave,
  onEditPicks,
  savedMessage,
}: JourneyRoutePanelProps) {
  const stopCount = plan.stops.filter((stop) => stop.type === "recommendation").length;

  return (
    <>
      <section className="h-[320px] shrink-0 lg:h-auto lg:min-h-[520px] lg:flex-1">
        <PlanMap
          stops={plan.stops}
          routePath={plan.routePath}
          selectedStopId={selectedStopId}
          onSelectStop={onSelectStop}
          totalDistanceMeters={plan.totalDistanceMeters}
          estimatedDurationMinutes={plan.routeStats?.estimatedDurationMinutes}
        />
      </section>

      <section className="flex flex-1 flex-col gap-4 lg:max-w-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-medium tracking-tight text-foreground">
              Your walking route
            </h2>
            <p className="text-sm text-muted">
              {formatDistance(plan.totalDistanceMeters)} · {stopCount} stops
              {plan.destination.name ? ` · ending at ${plan.destination.name}` : ""}
            </p>
            {plan.routeStats && (
              <p className="text-sm text-muted">
                ~{formatWalkDuration(plan.routeStats.estimatedDurationMinutes)} walk ·{" "}
                ~{plan.routeStats.estimatedSteps.toLocaleString()} steps
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onSave}
            className="brand-button-secondary shrink-0"
          >
            Save
          </button>
        </div>

        {savedMessage && (
          <p className="border border-border bg-accent-subtle px-4 py-3 text-sm text-foreground">
            {savedMessage}
          </p>
        )}

        <JournalTimeline
          stops={plan.stops}
          selectedStopId={selectedStopId}
          onSelectStop={onSelectStop}
        />

        <a
          href={buildWalkingDirectionsUrl(
            plan.stops.map((stop) => ({
              lat: stop.lat,
              lng: stop.lng,
              name: stop.name,
              placeId: stop.placeId,
              googleMapsUri: stop.googleMapsUri,
            })),
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="brand-button-primary inline-flex justify-center"
        >
          Open in Google Maps
        </a>

        <button
          type="button"
          onClick={onEditPicks}
          className="brand-button-secondary w-full justify-center"
        >
          Edit picks
        </button>
      </section>
    </>
  );
}
