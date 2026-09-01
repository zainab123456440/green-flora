/**
 * components/market/CropSelector.tsx
 *
 * Searchable crop selector for the Market Intelligence page.
 * Lists every AMIS commodity that has price data and shows the
 * current price + latest date right in the trigger, so the farmer
 * sees the essentials immediately after selecting a crop.
 *
 * Accessible combobox pattern: keyboard navigation (arrows, enter,
 * escape), aria attributes, and click-outside dismissal.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Sprout } from "lucide-react";
import type { MarketCommodity } from "@/types/market";
import { formatMarketDate, formatPKR } from "@/lib/marketUtils";

interface CropSelectorProps {
  commodities: MarketCommodity[];
  value: string | null;
  onChange: (commodityId: string) => void;
}

export default function CropSelector({
  commodities,
  value,
  onChange,
}: CropSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = useMemo(
    () => commodities.find((c) => c.id === value) ?? null,
    [commodities, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commodities;
    return commodities.filter((c) => c.name.toLowerCase().includes(q));
  }, [commodities, query]);

  // Click-outside dismissal.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const select = useCallback(
    (id: string) => {
      onChange(id);
      setOpen(false);
    },
    [onChange]
  );

  // Open the dropdown: clear any previous search, reset the
  // highlight, and focus the search field once it has rendered.
  const openDropdown = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
    requestAnimationFrame(() => searchRef.current?.focus());
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          openDropdown();
        }
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filtered[activeIndex]) select(filtered[activeIndex].id);
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [open, filtered, activeIndex, select, openDropdown]
  );

  // Keep the active option in view while navigating by keyboard.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !open) return;
    const item = list.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const listId = "market-crop-selector-list";

  return (
    <div ref={rootRef} className="relative w-full" onKeyDown={onKeyDown}>
      <label
        id="market-crop-selector-label"
        className="mb-1.5 block text-xs font-medium text-neutral-500"
      >
        Crop
      </label>

      {/* Trigger */}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-labelledby="market-crop-selector-label"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className="flex w-full items-center gap-3 rounded-input border border-neutral-200 bg-surface-input px-3.5 py-2.5 text-left transition-colors duration-150 hover:border-primary-400 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          <Sprout className="h-4 w-4" />
        </span>
        {selected ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-neutral-900">
              {selected.name}
            </span>
            <span className="block truncate text-xs text-neutral-500">
              {formatPKR(selected.latest_price)}{" "}
              <span className="text-neutral-400">
                · {formatMarketDate(selected.latest_date)}
              </span>
            </span>
          </span>
        ) : (
          <span className="flex-1 text-sm text-neutral-400">
            Select a crop…
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-card border border-neutral-200 bg-surface-elevated shadow-dropdown">
          <div className="border-b border-neutral-100 p-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <input
                ref={searchRef}
                type="text"
                role="searchbox"
                aria-label="Search crops"
                placeholder="Search crops…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                className="w-full rounded-input border border-neutral-200 bg-surface-input py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
              />
            </div>
          </div>

          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            aria-label="Crops"
            className="gf-scrollbar max-h-72 overflow-y-auto py-1"
          >
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-xs text-neutral-400">
                No crops match “{query}”
              </li>
            )}
            {filtered.map((c, i) => {
              const isSelected = c.id === value;
              const isActive = i === activeIndex;
              return (
                <li
                  key={c.id}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => select(c.id)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-sm transition-colors duration-100 ${
                    isActive ? "bg-primary-50" : ""
                  } ${isSelected ? "font-semibold" : ""}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-neutral-900">
                      {c.name}
                    </span>
                    <span className="block text-[11px] text-neutral-400">
                      {c.markets_reporting}{" "}
                      {c.markets_reporting === 1 ? "market" : "markets"} ·{" "}
                      {formatMarketDate(c.latest_date)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-primary-700">
                    {formatPKR(c.latest_price)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
