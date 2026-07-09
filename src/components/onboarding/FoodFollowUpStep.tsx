"use client";

import type { FoodStyle } from "@/lib/types";
import { FOOD_STYLE_OPTIONS } from "@/lib/onboarding";

type FoodFollowUpStepProps = {
  value: FoodStyle | undefined;
  onChange: (value: FoodStyle) => void;
};

export function FoodFollowUpStep({ value, onChange }: FoodFollowUpStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Because you chose Food
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          What are you craving right now?
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          From a quick coffee to a proper sit-down — tell us your mood.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {FOOD_STYLE_OPTIONS.map((option, index) => {
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
