"use client";

import type { JourneyMode } from "@/lib/types";
import { JOURNEY_MODE_OPTIONS } from "@/lib/modes";
import { SelectableOption } from "./SelectableOption";

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

      <div
        className="flex flex-col gap-3"
        role="radiogroup"
        aria-label="Journey mode"
      >
        {JOURNEY_MODE_OPTIONS.map((option, index) => (
          <SelectableOption
            key={option.value}
            selected={value === option.value}
            onSelect={() => onChange(option.value)}
            title={option.label}
            description={option.description}
            badge={option.context}
            animationDelay={`${index * 0.08}s`}
          />
        ))}
      </div>
    </div>
  );
}
