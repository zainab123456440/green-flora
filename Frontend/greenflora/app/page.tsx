/**
 * app/page.tsx
 *
 * Root page — redirects based on authentication state.
 * Authenticated users go to /dashboard; everyone else to /login.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";
import { useAuth } from "@/Hooks/useAuth";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [isLoading, isAuthenticated, router]);

  // While deciding where to redirect, show a minimal loading screen.
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-700 animate-gf-pulse">
          <Leaf className="h-5 w-5 text-primary-100" />
        </div>
      </div>
    </div>
  );
}
