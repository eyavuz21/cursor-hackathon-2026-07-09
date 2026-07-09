import Link from "next/link";
import type { ReactNode } from "react";

type AppHeaderProps = {
  subtitle?: string;
  actions?: ReactNode;
};

export function AppHeader({ subtitle, actions }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-surface px-6 py-5">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-block h-2 w-2 bg-highlight" />
            <span className="brand-label">Wander</span>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/explore"
                className="px-3 py-1.5 font-medium tracking-wide text-muted transition-colors hover:text-foreground"
              >
                Explore
              </Link>
              <Link
                href="/shop"
                className="px-3 py-1.5 font-medium tracking-wide text-muted transition-colors hover:text-foreground"
              >
                Shop planner
              </Link>
              <Link
                href="/plan"
                className="px-3 py-1.5 font-medium tracking-wide text-muted transition-colors hover:text-foreground"
              >
                Journal planner
              </Link>
            </nav>
          </div>
          {subtitle && (
            <p className="text-sm tracking-wide text-muted">{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
    </header>
  );
}
