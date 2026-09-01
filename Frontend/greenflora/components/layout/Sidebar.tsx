"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sprout,
  MapPin,
  User,
  CloudSun,
  Stethoscope,
  TrendingUp,
  Tractor,
  Users,
  X,
  Leaf,
} from "lucide-react";
import type { ReactNode } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  enabled: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4.5 w-4.5" />, enabled: true },
  { label: "My Farm", href: "/my-farm", icon: <MapPin className="h-4.5 w-4.5" />, enabled: true },
  { label: "Farmer Profile", href: "/profile", icon: <User className="h-4.5 w-4.5" />, enabled: true },
  { label: "Weather", href: "/weather", icon: <CloudSun className="h-4.5 w-4.5" />, enabled: true },
  { label: "Crop Doctor", href: "/crop-doctor", icon: <Stethoscope className="h-4.5 w-4.5" />, enabled: true },
  { label: "Market", href: "/market", icon: <TrendingUp className="h-4.5 w-4.5" />, enabled: true },
  { label: "Machinery", href: "/machinery", icon: <Tractor className="h-4.5 w-4.5" />, enabled: false },
  { label: "Experts", href: "/experts", icon: <Users className="h-4.5 w-4.5" />, enabled: false },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-950/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-[260px] flex-col border-r border-neutral-200 bg-surface-sidebar
          transition-transform duration-200 ease-in-out
          md:translate-x-0 md:z-30
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Sidebar navigation"
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
            onClick={onClose}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700">
              <Leaf className="h-4.5 w-4.5 text-primary-50" />
            </div>
            <span className="text-base font-semibold tracking-tight text-neutral-900">
              Green Flora
            </span>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="gf-scrollbar flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname?.startsWith(item.href);

              if (!item.enabled) {
                return (
                  <li key={item.href}>
                    <span
                      title="Coming soon"
                      className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-400"
                    >
                      <span className="text-neutral-300">{item.icon}</span>
                      {item.label}
                      <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-neutral-300">
                        Soon
                      </span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150
                      ${
                        isActive
                          ? "bg-primary-700 text-primary-50 shadow-sm"
                          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                      }`}
                  >
                    <span
                      className={
                        isActive ? "text-primary-200" : "text-neutral-500"
                      }
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-5 py-4">
          <p className="text-[11px] text-neutral-400">
            Green Flora v0.4 — Phase 4
          </p>
        </div>
      </aside>
    </>
  );
}

export { NAV_ITEMS };
