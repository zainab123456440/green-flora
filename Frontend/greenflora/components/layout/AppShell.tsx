"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface AppShellProps {
  children: ReactNode;
  title?: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-primary">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area — offset on desktop for sidebar */}
      <div className="md:ml-[260px]">
        <TopBar
          title={title}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
