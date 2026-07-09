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
        <h3 className="brand-label">{title}</h3>
        <p className="text-sm text-muted">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option, index) => {
          const selected = value.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`onboarding-animate-fade-up brand-card p-3 text-left ${
                selected ? "brand-card-selected" : "hover:border-muted"
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {option.label}
                  </span>
                  <span className="text-xs text-muted">
                    {option.description}
                  </span>
                </div>
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] ${
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border"
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
        <h2 className="brand-heading">
          What are you in the mood for?
        </h2>
        <p className="text-muted">
          Select as many as you like from history and food — pick at least one
          total.
        </p>
        {value.length > 0 && (
          <p className="text-xs uppercase tracking-wider text-muted">
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
