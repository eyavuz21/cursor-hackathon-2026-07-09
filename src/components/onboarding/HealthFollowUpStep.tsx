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
        <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Based on your pace
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((option, index) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`onboarding-animate-fade-up rounded-2xl border p-4 text-left transition-colors ${
                selected
                  ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              }`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {option.label}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
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
