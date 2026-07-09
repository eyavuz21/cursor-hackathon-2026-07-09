"use client";

import type { Interest } from "@/lib/types";
import {
  FOOD_INTEREST_OPTIONS,
  HISTORY_INTEREST_OPTIONS,
} from "@/lib/interests";

type InterestsStepProps = {
  value: Interest[];
  onChange: (value: Interest[]) => void;
};

function InterestSection({
  title,
  description,
  options,
  value,
  onToggle,
}: {
  title: string;
  description: string;
  options: typeof HISTORY_INTEREST_OPTIONS;
  value: Interest[];
  onToggle: (interest: Interest) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option, index) => {
          const selected = value.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`onboarding-animate-fade-up rounded-xl border p-3 text-left transition-all duration-200 ${
                selected
                  ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10 dark:border-emerald-400 dark:bg-emerald-950/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {option.label}
                  </span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                    {option.description}
                  </span>
                </div>
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
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
    </section>
  );
}

export function InterestsStep({ value, onChange }: InterestsStepProps) {
  function toggleInterest(interest: Interest) {
    if (value.includes(interest)) {
      onChange(value.filter((item) => item !== interest));
      return;
    }

    onChange([...value, interest]);
  }

  const historyCount = value.filter((item) =>
    HISTORY_INTEREST_OPTIONS.some((option) => option.value === item),
  ).length;
  const foodCount = value.filter((item) =>
    FOOD_INTEREST_OPTIONS.some((option) => option.value === item),
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="onboarding-animate-fade-up flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          What are you in the mood for?
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Select as many as you like from history and food — pick at least one
          total.
        </p>
        {value.length > 0 && (
          <p className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
            {value.length} selected
            {historyCount > 0 ? ` · ${historyCount} history` : ""}
            {foodCount > 0 ? ` · ${foodCount} food` : ""}
          </p>
        )}
      </div>

      <InterestSection
        title="History & culture"
        description="Choose all the cultural experiences you enjoy."
        options={HISTORY_INTEREST_OPTIONS}
        value={value}
        onToggle={toggleInterest}
      />

      <InterestSection
        title="Food & drink"
        description="Choose all the food spots you'd like to discover."
        options={FOOD_INTEREST_OPTIONS}
        value={value}
        onToggle={toggleInterest}
      />
    </div>
  );
}
