"use client";

import type { HealthGoal } from "@/lib/types";
import {
  getHealthFollowUpPrompt,
  getOutingOptionsForGoal,
} from "@/lib/onboarding";
import type { OutingStyle } from "@/lib/types";

type HealthFollowUpStepProps = {
  healthGoal: HealthGoal;
  value: OutingStyle | undefined;
  onChange: (value: OutingStyle) => void;
};

export function HealthFollowUpStep({
  healthGoal,
  value,
  onChange,
}: HealthFollowUpStepProps) {
  const { title, subtitle } = getHealthFollowUpPrompt(healthGoal);
  const options = getOutingOptionsForGoal(healthGoal);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="brand-label">Based on your pace</p>
        <h2 className="brand-heading">{title}</h2>
        <p className="text-muted">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((option, index) => {
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
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">
                  {option.label}
                </span>
                <span className="text-sm text-muted">
                  {option.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
