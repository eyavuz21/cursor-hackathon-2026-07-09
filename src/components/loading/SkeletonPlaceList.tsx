type SkeletonPlaceListProps = {
  count?: number;
};

export function SkeletonPlaceList({ count = 5 }: SkeletonPlaceListProps) {
  return (
    <ul className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="brand-card p-4">
          <div className="flex items-start gap-3">
            <div className="h-4 w-4 shrink-0 rounded-sm wander-shimmer" />
            <div className="h-7 w-7 shrink-0 wander-shimmer" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="h-4 w-3/4 wander-shimmer" />
              <div className="h-3 w-full wander-shimmer" />
              <div className="mt-1 flex gap-3">
                <div className="h-3 w-12 wander-shimmer" />
                <div className="h-3 w-16 wander-shimmer" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
