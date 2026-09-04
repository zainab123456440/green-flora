"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  MapPin,
  User,
  CloudSun,
  Stethoscope,
  TrendingUp,
  Calculator,
  LogOut,
  X,
  Leaf,
} from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/Hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4.5 w-4.5" />,
  },
  {
    label: "Farmer Profile",
    href: "/profile",
    icon: <User className="h-4.5 w-4.5" />,
  },
  {
    label: "My Farm",
    href: "/my-farm",
    icon: <MapPin className="h-4.5 w-4.5" />,
  },
  {
    label: "Weather",
    href: "/weather",
    icon: <CloudSun className="h-4.5 w-4.5" />,
  },
  {
    label: "Market Prices",
    href: "/market",
    icon: <TrendingUp className="h-4.5 w-4.5" />,
  },
  {
    label: "Profit Calculator",
    href: "/profit-calculator",
    icon: <Calculator className="h-4.5 w-4.5" />,
  },
  {
    label: "Crop Doctor",
    href: "/crop-doctor",
    icon: <Stethoscope className="h-4.5 w-4.5" />,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      // logout() clears tokens/session state; send the user to login.
      router.replace("/login");
    }
  }

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 shadow-sm">
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
              const isActive = pathname?.startsWith(item.href) ?? false;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150
                      ${
                        isActive
                          ? "bg-gradient-to-r from-primary-700 to-primary-600 text-primary-50 shadow-sm"
                          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                      }`}
                  >
                    <span
                      className={
                        isActive
                          ? "text-primary-200"
                          : "text-neutral-500"
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

        {/* Footer — logout + version */}
        <div className="border-t border-neutral-200 px-3 py-3">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors duration-150 hover:bg-danger-50 hover:text-danger-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4.5 w-4.5" />

            {isLoggingOut ? "Signing out…" : "Log out"}
          </button>

          <p className="px-3 pt-2.5 text-[11px] text-neutral-400">
            Green Flora
          </p>
        </div>
      </aside>
    </>
  );
}