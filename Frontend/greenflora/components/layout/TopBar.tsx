"use client";

import { Menu, Bell, User } from "lucide-react";

interface TopBarProps {
  title?: string;
  onMenuToggle: () => void;
}

export default function TopBar({ title, onMenuToggle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-surface-primary/95 px-4 backdrop-blur-sm sm:px-6">
      {/* Left: mobile menu toggle + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {title && (
          <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
        )}
      </div>

      {/* Right: notification + profile placeholders */}
      <div className="flex items-center gap-1">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Notifications"
          title="Notifications (coming soon)"
        >
          <Bell className="h-4.5 w-4.5" />
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Profile"
          title="Profile"
        >
          <User className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
