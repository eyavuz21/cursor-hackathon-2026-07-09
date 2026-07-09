import { WanderLoader } from "@/components/loading/WanderLoader";
import { StepProgress } from "@/components/loading/StepProgress";

type LoadingScreenProps = {
  title: string;
  subtitle?: string;
  currentStep?: number;
  totalSteps?: number;
  stepLabels?: string[];
  flowLabel?: string;
};

export function LoadingScreen({
  title,
  subtitle,
  currentStep,
  totalSteps,
  stepLabels,
  flowLabel = "Wander",
}: LoadingScreenProps) {
  const showProgress =
    currentStep !== undefined &&
    totalSteps !== undefined &&
    totalSteps > 0;

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-background px-6 py-12 font-sans">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <main className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center">
        {showProgress && (
          <div className="w-full text-left">
            <StepProgress
              label={flowLabel}
              currentStep={currentStep}
              totalSteps={totalSteps}
              steps={stepLabels}
            />
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          <WanderLoader />
          <div className="flex flex-col gap-2">
            <h1 className="brand-heading text-2xl">{title}</h1>
            {subtitle && (
              <p className="text-sm leading-relaxed text-muted">{subtitle}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
