---
kind: frontend_style
name: Green Flora Design System — Tailwind v4 + CSS Custom Properties Theme
category: frontend_style
scope:
    - '**'
source_files:
    - Frontend/greenflora/app/globals.css
    - Frontend/greenflora/postcss.config.mjs
    - Frontend/greenflora/app/layout.tsx
    - Frontend/greenflora/package.json
    - Frontend/greenflora/components/ui/Button.tsx
    - Frontend/greenflora/components/ui/Card.tsx
    - Frontend/greenflora/components/ui/Input.tsx
    - Frontend/greenflora/components/layout/AppShell.tsx
    - Frontend/greenflora/components/layout/Sidebar.tsx
---

## What system/approach is used

The Green Flora Next.js frontend (under `Frontend/greenflora/`) uses **Tailwind CSS v4** as its styling engine, configured via `@tailwindcss/postcss` in `postcss.config.mjs`. All styles are authored in a single global stylesheet (`app/globals.css`) that imports Tailwind with `@import "tailwindcss"` and defines the project's design tokens through **CSS custom properties** under a `--gf-*` namespace. These variables are then exposed to Tailwind using the v4 `@theme inline` block, so components style themselves with semantic class names like `bg-primary-700`, `text-neutral-900`, `shadow-card`, and `rounded-button` rather than raw hex values.

The visual identity is an agricultural green palette: deep forest greens (`--gf-green-900` … `--gf-green-50`), earth/warm tones (`--gf-earth-*`), neutral warm grays (`--gf-neutral-*`), and state accents for amber (warnings), red (danger), sky (info), and emerald (success). Shadows, border radii, surfaces, and sidebar dimensions are also tokenized.

Typography is provided by Google Fonts loaded at the root layout: **Geist Sans** and **Geist Mono** for English, and **Noto Nastaliq Urdu** for Urdu. The font families are registered as CSS variables (`--font-geist-sans`, `--font-geist-mono`, `--font-urdu`) and referenced from both the Tailwind theme and the body font stack.

## Key files and packages

- `Frontend/greenflora/package.json` — declares dependencies: `next 16.2.11`, `react 19.2.4`, `tailwindcss ^4`, `@tailwindcss/postcss ^4`, plus `lucide-react` for icons, `recharts` for charts, and `leaflet` / `react-leaflet` for maps.
- `Frontend/greenflora/app/globals.css` — the single source of truth for design tokens, Tailwind `@theme` mapping, base styles, animations, RTL/Urdu overrides, Leaflet map theming, and reduced-motion handling.
- `Frontend/greenflora/postcss.config.mjs` — registers `@tailwindcss/postcss` as the only PostCSS plugin.
- `Frontend/greenflora/app/layout.tsx` — root layout that loads Geist/Noto fonts via `next/font/google`, applies the font variable classes on `<html>`, and wraps the app in `AuthProvider` and `LanguageProvider`.
- `Frontend/greenflora/components/ui/*` — shared primitive UI components (`Button.tsx`, `Card.tsx`, `Input.tsx`, `Badge.tsx`, `Select.tsx`, `ProgressBar.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `LoadingState.tsx`) that consume the design tokens via Tailwind utility classes.
- `Frontend/greenflora/components/layout/AppShell.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `AuthLayout.tsx` — page chrome built on the same token system; `AppShell` provides the responsive sidebar offset (`md:ml-[260px]`) matching `--gf-sidebar-width`.

## Architecture and conventions

### Token layering
1. **CSS custom properties** (`:root { --gf-* }`) hold the canonical color, shadow, radius, and surface values.
2. **Tailwind `@theme inline`** re-exports those variables as semantic design tokens (`--color-primary-*`, `--color-earth-*`, `--color-neutral-*`, `--color-surface-*`, `--color-danger-*`, `--color-info-*`, `--color-success-*`, `--shadow-*`, `--radius-*`).
3. **Components** reference the semantic tokens exclusively (e.g. `Button` uses `bg-primary-700 text-primary-50 hover:bg-primary-800 focus-visible:ring-primary-600`; `Card` uses `bg-surface-card shadow-card border border-neutral-200`).

### Component library pattern
Each primitive in `components/ui/` follows the same shape:
- A typed props interface with a `variant` enum (e.g. `ButtonVariant = "primary" | "secondary" | "ghost" | "danger"`, `CardVariant = "default" | "elevated" | "outlined"`) and optional `size` or `padding` enums.
- A `variantStyles` / `sizeStyles` / `paddingStyles` lookup table of Tailwind class strings.
- A default variant/size/spacing, a `className` prop for composition, and consistent focus rings (`focus-visible:ring-*`) and disabled states.

### Layout and responsiveness
- `AppShell` uses Tailwind breakpoints (`md:`) to switch between a mobile overlay sidebar and a fixed desktop sidebar offset by `260px` (matching `--gf-sidebar-width`).
- Content area uses `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8` for consistent horizontal rhythm.
- No media-query-based theme switching exists; all breakpoints are handled via Tailwind utilities.

### Language & direction
- `globals.css` defines `.urdu-mode` and `html[lang="ur"]` selectors that force `direction: rtl` and apply Noto Nastaliq Urdu with increased `line-height: 2.1` to prevent diacritic clipping.
- `layout.tsx` injects a Google Translate script (English → Urdu) and hides its UI elements via CSS overrides.

### Animations
- All animations live in `globals.css` under `@keyframes gf-*` with corresponding `.animate-gf-*` utility classes (fade-in, slide-in-left, pulse, float, sway, shake, rain, cloud drift, sun glow, wind sway, snow fall).
- A `prefers-reduced-motion: reduce` block disables every animation for accessibility.

### Third-party integration
- Leaflet maps are themed via dedicated `.leaflet-*` rules that inherit the design system's border radius, shadows, and colors.
- Icons come from `lucide-react` and are styled purely with Tailwind size/utility classes.

## Conventions and constraints

- **No component-scoped CSS modules or CSS-in-JS**: all styling is done with Tailwind utility classes applied directly in JSX; there are no per-component `.css` files.
- **Colors must not be hardcoded**: use the semantic `primary-*`, `earth-*`, `neutral-*`, `surface-*`, `danger-*`, `info-*`, `success-*` tokens defined in `globals.css`'s `@theme` block.
- **Shadows and radii are tokenized**: use `shadow-card`, `shadow-elevated`, `shadow-dropdown`, `rounded-card`, `rounded-input`, `rounded-button`, `rounded-badge` instead of raw `box-shadow` or `border-radius` values.
- **Focus management**: interactive primitives expose `focus-visible:ring-*` variants; a global `.gf-focus-ring` utility is available for non-primitive elements.
- **RTL/Urdu mode**: when the language context switches to Urdu, the `urdu-mode` class (or `html[lang="ur"]`) automatically applies RTL direction and the Nastaliq font family; new components should not override this.
- **Reduced motion**: any new animation should be wrapped in a `prefers-reduced-motion` check following the existing pattern in `globals.css`.
- **Sidebar width consistency**: the fixed sidebar width is `260px` (defined as `--gf-sidebar-width`); layout offsets and widths should reference this value rather than hardcoding pixel amounts.
- **Font loading**: fonts are loaded via `next/font/google` in `app/layout.tsx` and exposed as CSS variables; do not import fonts elsewhere.