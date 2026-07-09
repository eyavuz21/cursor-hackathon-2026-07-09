"use client";

type SubOptionChip = {
  value: string;
  label: string;
  description?: string;
};

type SubOptionChipsProps = {
  label: string;
  hint?: string;
  options: SubOptionChip[];
  selected: string[];
  onChange: (selected: string[]) => void;
  selectionType?: "single" | "multiple";
};

export function SubOptionChips({
  label,
  hint,
  options,
  selected,
  onChange,
  selectionType = "single",
}: SubOptionChipsProps) {
  function toggle(value: string) {
    if (selectionType === "single") {
      onChange([value]);
      return;
    }

    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }

    onChange([...selected, value]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {label}
        </p>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>

      <div
        className="flex flex-wrap gap-2"
        role={selectionType === "single" ? "radiogroup" : "group"}
        aria-label={label}
      >
        {options.map((option) => {
          const isSelected = selected.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              role={selectionType === "single" ? "radio" : "checkbox"}
              aria-checked={isSelected}
              title={option.description}
              onClick={() => toggle(option.value)}
              className={`brand-chip ${isSelected ? "brand-chip-selected" : ""}`}
            >
              {isSelected ? (
                <svg
                  aria-hidden
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="shrink-0"
                >
                  <path
                    d="M2.5 6L5 8.5L9.5 4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
