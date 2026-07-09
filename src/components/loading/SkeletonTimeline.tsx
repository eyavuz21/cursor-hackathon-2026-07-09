type SkeletonTimelineProps = {
  count?: number;
};

export function SkeletonTimeline({ count = 4 }: SkeletonTimelineProps) {
  return (
    <ol className="flex flex-col gap-0" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="h-9 w-9 rounded-full wander-shimmer" />
            {index < count - 1 && (
              <span className="my-1 h-12 w-px bg-border" />
            )}
          </div>
          <div className="brand-card mb-4 flex-1 p-4">
            <div className="flex flex-col gap-2">
              <div className="h-3 w-16 wander-shimmer" />
              <div className="h-4 w-2/3 wander-shimmer" />
              <div className="h-3 w-full wander-shimmer" />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
