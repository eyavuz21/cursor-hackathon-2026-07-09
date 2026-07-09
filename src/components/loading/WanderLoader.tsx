type WanderLoaderProps = {
  size?: "sm" | "md";
};

export function WanderLoader({ size = "md" }: WanderLoaderProps) {
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      <span className={`wander-loader-dot inline-block rounded-full bg-highlight ${dotSize}`} />
      <span className={`wander-loader-dot inline-block rounded-full bg-highlight ${dotSize}`} />
      <span className={`wander-loader-dot inline-block rounded-full bg-highlight ${dotSize}`} />
    </div>
  );
}
