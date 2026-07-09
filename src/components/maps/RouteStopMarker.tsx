import { getStopLetter } from "@/lib/stop-labels";

type RouteStopMarkerProps = {
  index: number;
  name: string;
  selected?: boolean;
  isDestination?: boolean;
  onSelect?: () => void;
};

export function RouteStopMarker({
  index,
  name,
  selected = false,
  isDestination = false,
  onSelect,
}: RouteStopMarkerProps) {
  const letter = getStopLetter(index);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
      className="flex flex-col items-center gap-1"
      title={name}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold shadow-md transition-colors ${
          selected
            ? "border-[#1a73e8] bg-[#1a73e8] text-white"
            : isDestination
              ? "border-[#d93025] bg-white text-[#d93025]"
              : "border-[#1a73e8] bg-white text-[#1a73e8]"
        }`}
      >
        {letter}
      </span>
      <span
        className={`max-w-[140px] truncate rounded border px-1.5 py-0.5 text-[10px] font-medium shadow-sm ${
          selected
            ? "border-foreground bg-foreground text-background"
            : "border-white/90 bg-white/95 text-foreground"
        }`}
      >
        {name}
      </span>
    </button>
  );
}
