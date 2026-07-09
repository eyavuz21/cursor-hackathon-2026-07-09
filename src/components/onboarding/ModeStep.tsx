"use client";

import type { JourneyMode } from "@/lib/types";
import { JOURNEY_MODE_OPTIONS } from "@/lib/modes";

type ModeStepProps = {
  value: JourneyMode | null;
  onChange: (value: JourneyMode) => void;
};

export function ModeStep({ value, onChange }: ModeStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="onboarding-animate-fade-up flex flex-col gap-2">
        <p className="brand-label">Your vibe</p>
        <h2 className="brand-heading">How do you want to wander?</h2>
        <p className="text-muted">
          Pick a mode — we&apos;ll tailor one quick follow-up, then handle the rest.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {JOURNEY_MODE_OPTIONS.map((option, index) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`onboarding-animate-fade-up brand-card p-4 text-left ${
                selected ? "brand-card-selected" : "hover:border-muted"
              }`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    {option.label}
                  </span>
                  <span className="text-sm text-muted">{option.description}</span>
                </div>
                <span className="shrink-0 border border-border px-2.5 py-1 text-xs uppercase tracking-wider text-muted">
                  {option.context}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
