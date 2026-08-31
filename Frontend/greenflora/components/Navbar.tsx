/**
 * components/Navbar.tsx
 *
 * Shared top navigation bar. Note: the main app pages (dashboard,
 * my-farm) use the AppShell layout with a sidebar instead. This
 * component is preserved for potential reuse in contexts that need
 * a simpler top-only navigation.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  enabled: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", enabled: true },
  { label: "My Farm", href: "/my-farm", enabled: true },
  { label: "Weather", href: "/weather", enabled: false },
  { label: "Crop Doctor", href: "/crop-doctor", enabled: false },
  { label: "Market", href: "/market", enabled: false },
  { label: "Experts", href: "/experts", enabled: false },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-surface-primary/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-primary-700"
        >
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-sm font-semibold text-primary-50"
          >
            GF
          </span>
          <span className="text-lg font-semibold tracking-tight text-neutral-900">
            Green Flora
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex items-center gap-1 overflow-x-auto"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);

            if (!item.enabled) {
              return (
                <span
                  key={item.href}
                  title="Coming soon"
                  className="cursor-not-allowed whitespace-nowrap rounded-md px-3 py-2 text-sm text-neutral-400"
                >
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-700 text-primary-50"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
