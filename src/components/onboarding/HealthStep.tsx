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
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          How far do you like to walk?
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          We&apos;ll use this to find places within a comfortable distance.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {HEALTH_GOAL_OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                selected
                  ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {option.label}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {option.description}
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
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
