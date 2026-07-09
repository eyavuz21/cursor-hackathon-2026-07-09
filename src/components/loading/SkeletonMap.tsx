export function SkeletonMap() {
  return (
    <div
      className="flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-3 border border-border bg-accent-subtle"
      aria-hidden
    >
      <div className="h-10 w-10 rounded-full wander-shimmer" />
      <p className="text-xs uppercase tracking-wider text-muted">Loading map…</p>
    </div>
  );
}
