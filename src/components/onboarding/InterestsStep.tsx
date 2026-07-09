"use client";

import type { Interest } from "@/lib/types";
import {
  FOOD_INTEREST_OPTIONS,
  HISTORY_INTEREST_OPTIONS,
} from "@/lib/interests";
import { SelectableOption } from "./SelectableOption";

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((option, index) => (
          <SelectableOption
            key={option.value}
            selected={value.includes(option.value)}
            onSelect={() => onToggle(option.value)}
            title={option.label}
            description={option.description}
            selectionType="multiple"
            animationDelay={`${index * 0.05}s`}
          />
        ))}
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
