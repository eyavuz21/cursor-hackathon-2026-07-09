import { WanderLoader } from "@/components/loading/WanderLoader";

type LoadingOverlayProps = {
  title: string;
  subtitle?: string;
  steps?: string[];
  activeStepIndex?: number;
};

export function LoadingOverlay({
  title,
  subtitle,
  steps,
  activeStepIndex = 0,
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 px-6 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <WanderLoader />
        <div className="flex flex-col gap-2">
          <h2 className="brand-heading text-xl">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>

        {steps && steps.length > 0 && (
          <ul className="flex w-full flex-col gap-2 text-left">
            {steps.map((step, index) => {
              const isActive = index === activeStepIndex;
              const isDone = index < activeStepIndex;

              return (
                <li
                  key={step}
                  className={`flex items-center gap-3 border px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "border-foreground bg-accent-subtle text-foreground"
                      : isDone
                        ? "border-border text-muted"
                        : "border-border text-muted/70"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-semibold ${
                      isDone
                        ? "bg-foreground text-background"
                        : isActive
                          ? "bg-highlight text-foreground wander-step-pulse"
                          : "bg-accent-subtle text-muted"
                    }`}
                  >
                    {isDone ? "✓" : index + 1}
                  </span>
                  <span className={isActive ? "font-medium" : undefined}>{step}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
