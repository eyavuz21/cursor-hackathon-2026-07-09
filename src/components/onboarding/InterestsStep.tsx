"use client";

import type { Interest } from "@/lib/types";
import { INTEREST_OPTIONS } from "@/lib/preferences";

type InterestsStepProps = {
  value: Interest[];
  onChange: (value: Interest[]) => void;
};

export function InterestsStep({ value, onChange }: InterestsStepProps) {
  function toggleInterest(interest: Interest) {
    if (value.includes(interest)) {
      onChange(value.filter((item) => item !== interest));
      return;
    }

    onChange([...value, interest]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          What are you in the mood for?
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Pick at least one — we&apos;ll tailor recommendations to your interests.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {INTEREST_OPTIONS.map((option) => {
          const selected = value.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleInterest(option.value)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                selected
                  ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {option.label}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {option.description}
                  </span>
                </div>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                    selected
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {selected ? "✓" : ""}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
