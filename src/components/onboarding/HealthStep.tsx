"use client";

import type { HealthGoal } from "@/lib/types";
import { HEALTH_GOAL_OPTIONS } from "@/lib/preferences";
import { SelectableOption } from "./SelectableOption";

type HealthStepProps = {
  value: HealthGoal | null;
  onChange: (value: HealthGoal) => void;
};

export function HealthStep({ value, onChange }: HealthStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="onboarding-animate-fade-up flex flex-col gap-2">
        <h2 className="brand-heading">
          How far do you like to walk?
        </h2>
        <p className="text-muted">
          We&apos;ll use this to find places within a comfortable distance.
        </p>
      </div>

      <div
        className="flex flex-col gap-3"
        role="radiogroup"
        aria-label="Walking distance"
      >
        {HEALTH_GOAL_OPTIONS.map((option, index) => (
          <SelectableOption
            key={option.value}
            selected={value === option.value}
            onSelect={() => onChange(option.value)}
            title={option.label}
            description={option.description}
            badge={option.radiusLabel}
            animationDelay={`${index * 0.08}s`}
          />
        ))}
      </div>
    </div>
  );
}
