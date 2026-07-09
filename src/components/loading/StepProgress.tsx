type StepProgressProps = {
  label?: string;
  currentStep: number;
  totalSteps: number;
  steps?: string[];
};

export function StepProgress({
  label = "Wander",
  currentStep,
  totalSteps,
  steps,
}: StepProgressProps) {
  const safeCurrent = Math.min(Math.max(currentStep, 1), totalSteps);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="inline-block h-2 w-2 bg-highlight" />
        <span className="brand-label">{label}</span>
      </div>
      <p className="brand-label">
        Step {safeCurrent} of {totalSteps}
        {steps?.[safeCurrent - 1] ? ` · ${steps[safeCurrent - 1]}` : ""}
      </p>
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`h-0.5 flex-1 transition-colors duration-500 ${
              index < safeCurrent ? "bg-foreground" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
