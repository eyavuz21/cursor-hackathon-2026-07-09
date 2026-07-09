import Link from "next/link";
import type { ReactNode } from "react";

type AppHeaderProps = {
  subtitle?: string;
  actions?: ReactNode;
};

export function AppHeader({ subtitle, actions }: AppHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Wander
            </span>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/explore"
                className="rounded-full px-3 py-1 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              >
                Explore
              </Link>
              <Link
                href="/plan"
                className="rounded-full px-3 py-1 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              >
                Journal planner
              </Link>
            </nav>
          </div>
          {subtitle && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
    </header>
  );
}
