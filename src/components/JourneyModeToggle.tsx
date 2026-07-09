"use client";

import type { JourneyMode } from "@/lib/types";
import { JOURNEY_MODE_OPTIONS } from "@/lib/modes";

type JourneyModeToggleProps = {
  value: JourneyMode;
  onChange: (mode: JourneyMode) => void;
  disabled?: boolean;
};

export function JourneyModeToggle({
  value,
  onChange,
  disabled = false,
}: JourneyModeToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="brand-label">Journey mode</span>
      <div
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        role="group"
        aria-label="Journey mode"
      >
        {JOURNEY_MODE_OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`rounded-2xl border p-4 text-left transition-colors disabled:opacity-40 ${
                selected
                  ? "border-highlight bg-highlight/10"
                  : "border-border bg-surface hover:border-muted"
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {option.label}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {option.context}
                  </span>
                </div>
                <p className="text-sm text-muted">{option.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
