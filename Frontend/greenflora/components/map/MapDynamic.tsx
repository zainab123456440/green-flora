/**
 * components/map/MapDynamic.tsx
 *
 * Dynamic import wrapper for FarmMap to avoid SSR/window errors.
 * Use this component in pages instead of importing FarmMap directly.
 */

"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const FarmMap = dynamic(() => import("@/components/map/FarmMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-card border border-neutral-200 bg-neutral-50">
      <div className="flex flex-col items-center gap-2">
        <MapPin className="h-6 w-6 text-primary-600 animate-gf-pulse" />
        <p className="text-sm text-neutral-500">Loading map…</p>
      </div>
    </div>
  ),
});

export default FarmMap;
