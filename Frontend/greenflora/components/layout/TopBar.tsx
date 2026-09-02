"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, ChevronDown, User, Settings, LogOut } from "lucide-react";

import { useAuth } from "@/Hooks/useAuth";

interface TopBarProps {
  title?: string;
  onMenuToggle: () => void;
}

/** First-name initial + last-name initial, or the first letters of an email. */
function getInitials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || "";
  if (!source) return "…";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function TopBar({ title, onMenuToggle }: TopBarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    if (!isMenuOpen) return;

    function handleMouseDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isMenuOpen]);

  // Close the dropdown with the Escape key.
  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      // logout() clears tokens/session state; send the user to login.
      router.replace("/login");
    }
  }

  const displayName = user?.name ?? user?.email ?? "Farmer";
  const initials = getInitials(user?.name ?? null, user?.email ?? null);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-surface-primary/95 px-4 backdrop-blur-sm sm:px-6">
      {/* Left: mobile menu toggle + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-900 md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {title && (
          <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
        )}
      </div>

      {/* Right: profile menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors duration-150 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-label="Open profile menu"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-xs font-semibold text-primary-50">
            {initials}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-neutral-500 transition-transform duration-150 ${
              isMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isMenuOpen && (
          <div
            role="menu"
            aria-label="Profile menu"
            className="absolute right-0 top-full z-30 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-neutral-200 bg-surface-card shadow-dropdown animate-gf-pop"
          >
            {/* User identity */}
            <div className="border-b border-neutral-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-neutral-900">
                {displayName}
              </p>
              {user?.email && user.name && (
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {user.email}
                </p>
              )}
            </div>

            {/* Menu actions */}
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <User className="h-4 w-4 text-neutral-400" />
                Profile
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <Settings className="h-4 w-4 text-neutral-400" />
                Edit Profile
              </Link>
            </div>

            <div className="border-t border-neutral-100 py-1">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-danger-600 transition-colors duration-150 hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? "Signing out…" : "Log out"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
