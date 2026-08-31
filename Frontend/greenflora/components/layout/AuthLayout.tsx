/**
 * components/layout/AuthLayout.tsx
 *
 * Full-screen layout for the login and signup pages.
 *
 * Renders a nature-inspired background environment (layered gradients,
 * animated SVG foliage, subtle light spots) with a centered, elevated
 * white card for the form.  The form content is passed as `children`.
 *
 * The Green Flora wordmark sits at the top of the card.
 */

import type { ReactNode } from "react";
import { Leaf } from "lucide-react";

// ---------------------------------------------------------------------------
// Decorative SVG leaves — inline, no external assets
// ---------------------------------------------------------------------------

function LeafSvg({
  className,
  scale = 1,
  rotate = 0,
}: {
  className?: string;
  scale?: number;
  rotate?: number;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <path
        d="M60 10 C20 40, 10 100, 60 150 C110 100, 100 40, 60 10Z"
        fill="currentColor"
      />
      <path
        d="M60 30 L60 130"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
      />
      <path
        d="M60 60 L40 50 M60 80 L35 72 M60 100 L42 95 M60 60 L80 50 M60 80 L85 72 M60 100 L78 95"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />
    </svg>
  );
}

function GrassSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 120 L0 80 Q60 40, 120 70 Q180 100, 240 60 Q300 20, 360 55 Q420 90, 480 50 Q540 10, 600 45 Q660 80, 720 40 Q780 0, 840 35 Q900 70, 960 30 Q1020 0, 1080 40 Q1140 80, 1200 35 Q1260 0, 1320 45 Q1380 80, 1440 50 L1440 120Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      {/* ---- Layer 1: base gradient ---- */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #1B4332 0%, #2D6A4F 40%, #234E3E 70%, #1B4332 100%)",
        }}
      />

      {/* ---- Layer 2: radial light spots (dappled sunlight) ---- */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 600px 400px at 25% 20%, rgba(116,198,157,0.12) 0%, transparent 70%), " +
            "radial-gradient(ellipse 500px 350px at 75% 70%, rgba(149,213,178,0.09) 0%, transparent 70%), " +
            "radial-gradient(ellipse 400px 300px at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 60%)",
        }}
      />

      {/* ---- Layer 3: animated leaf silhouettes ---- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Top-left large leaf */}
        <LeafSvg
          className="absolute -top-8 -left-10 h-48 w-48 text-[#40916C] opacity-[0.10] animate-gf-float-slow"
          scale={1.2}
          rotate={-25}
        />

        {/* Top-right leaf cluster */}
        <LeafSvg
          className="absolute -top-4 -right-6 h-36 w-36 text-[#52B788] opacity-[0.08] animate-gf-sway"
          scale={1}
          rotate={40}
        />
        <LeafSvg
          className="absolute top-12 right-8 h-24 w-24 text-[#74C69D] opacity-[0.07] animate-gf-float"
          scale={0.8}
          rotate={15}
        />

        {/* Bottom-left leaf */}
        <LeafSvg
          className="absolute bottom-16 -left-4 h-32 w-32 text-[#52B788] opacity-[0.09] animate-gf-sway-slow"
          scale={1}
          rotate={-60}
        />

        {/* Bottom-right leaf */}
        <LeafSvg
          className="absolute -bottom-4 -right-8 h-44 w-44 text-[#40916C] opacity-[0.10] animate-gf-float-fast"
          scale={1.1}
          rotate={70}
        />

        {/* Mid-left small leaf */}
        <LeafSvg
          className="absolute top-1/3 -left-2 h-20 w-20 text-[#95D5B2] opacity-[0.06] animate-gf-float"
          scale={0.7}
          rotate={-10}
        />
      </div>

      {/* ---- Layer 4: bottom grass silhouette ---- */}
      <GrassSvg className="pointer-events-none absolute bottom-0 left-0 w-full h-20 text-[#1B4332] opacity-[0.35]" />

      {/* ---- Form card ---- */}
      <div className="relative z-10 w-full max-w-[420px] animate-gf-fade-in-up">
        <div className="rounded-xl bg-surface-card shadow-dropdown border border-white/10 p-8 sm:p-10">
          {/* Logo / wordmark */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-700">
                <Leaf className="h-5 w-5 text-primary-100" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-primary-900">
                Green Flora
              </span>
            </div>
            <p className="text-sm text-neutral-500">
              Your smart farming companion
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
