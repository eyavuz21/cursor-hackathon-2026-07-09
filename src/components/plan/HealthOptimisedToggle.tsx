"use client";

type HealthOptimisedToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function HealthOptimisedToggle({
  checked,
  onChange,
  disabled = false,
}: HealthOptimisedToggleProps) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
        checked
          ? "border-highlight bg-highlight/10"
          : "border-border bg-surface hover:border-muted"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-[var(--highlight)]"
      />
      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground">
          Health-optimised route
        </span>
        <span className="text-sm text-muted">
          Adds extra walking and scenic stops to increase your step count, while
          keeping the full journey within about 1 hour.
        </span>
      </div>
    </label>
  );
}
