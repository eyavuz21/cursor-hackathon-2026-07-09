"use client";

import type { HealthGoal } from "@/lib/types";
import { HEALTH_GOAL_OPTIONS } from "@/lib/preferences";

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

      <div className="flex flex-col gap-3">
        {HEALTH_GOAL_OPTIONS.map((option, index) => {
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
                  <span className="text-sm text-muted">
                    {option.description}
                  </span>
                </div>
                <span className="shrink-0 border border-border px-2.5 py-1 text-xs uppercase tracking-wider text-muted">
                  {option.radiusLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
