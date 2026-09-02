/**
 * components/dashboard/GovernmentSupportCard.tsx
 *
 * Compact dashboard card showing the active official government
 * farmer support service (e.g. the Punjab Agriculture Helpline).
 *
 * All values (name, organization, phone, hours, description) come
 * from the Supabase `government_support` table via the backend —
 * nothing is hardcoded here, so the helpline details can be updated
 * without a frontend change. The Call Now action opens the phone
 * dialer with the number from the database.
 */

"use client";

import { Clock, Landmark, Phone, PhoneCall } from "lucide-react";

import Card from "@/components/ui/Card";
import { useGovernmentSupport } from "@/Hooks/useGovernmentSupport";

/**
 * Build a tel: href from the database phone number. Keeps digits
 * (and a leading +) so a display value like "0800-17000" becomes a
 * dialable "tel:080017000" that mobile dialers accept reliably.
 */
function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

/** Compact shimmer placeholder while the record loads. */
function GovernmentSupportSkeleton() {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 shrink-0 rounded-lg bg-neutral-200 animate-gf-pulse" />
        <div className="w-full space-y-2.5">
          <div className="h-3 w-40 rounded bg-neutral-200 animate-gf-pulse" />
          <div className="h-5 w-56 max-w-full rounded bg-neutral-100 animate-gf-pulse" />
          <div className="h-4 w-72 max-w-full rounded bg-neutral-100 animate-gf-pulse" />
          <div className="h-6 w-44 rounded bg-neutral-100 animate-gf-pulse" />
        </div>
      </div>
    </Card>
  );
}

/** Small, quiet fallback so a missing record never breaks the dashboard. */
function GovernmentSupportFallback() {
  return (
    <Card padding="sm">
      <div className="flex items-center gap-3 text-neutral-400">
        <Landmark className="h-4.5 w-4.5 shrink-0" />
        <p className="text-sm">
          Government farmer support information is currently unavailable.
        </p>
      </div>
    </Card>
  );
}

export default function GovernmentSupportCard() {
  const { support, isLoading, error } = useGovernmentSupport();

  if (isLoading) {
    return <GovernmentSupportSkeleton />;
  }

  if (error || !support) {
    return <GovernmentSupportFallback />;
  }

  const telHref = toTelHref(support.phone);
  const callLabel = `Call ${support.name} at ${support.phone}`;

  return (
    <Card className="animate-gf-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
            <Landmark className="h-5.5 w-5.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-500">
              Government Farmer Support
            </p>
            <h3 className="mt-0.5 text-lg font-semibold text-neutral-900">
              {support.name}
            </h3>
            <p className="mt-0.5 text-sm text-neutral-500">
              {support.organization}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <a
                href={telHref}
                aria-label={callLabel}
                className="inline-flex items-center gap-1.5 text-lg font-semibold tracking-wide text-primary-700 transition-colors hover:text-primary-800"
              >
                <Phone className="h-4.5 w-4.5" />
                {support.phone}
              </a>
              {support.hours && (
                <span className="inline-flex items-center gap-1.5 text-sm text-neutral-500">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  {support.hours}
                </span>
              )}
            </div>
            {support.description && (
              <p className="mt-1.5 text-sm text-neutral-500">
                {support.description}
              </p>
            )}
          </div>
        </div>

        {/* Call Now — styled like the primary Button variant, as an
            anchor so the tel: link opens the dialer directly. */}
        <a
          href={telHref}
          aria-label={callLabel}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-button bg-primary-700 px-5 py-2.5 text-sm font-medium text-primary-50 transition-colors duration-150 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1 sm:w-auto"
        >
          <PhoneCall className="h-4 w-4" />
          Call Now
        </a>
      </div>
    </Card>
  );
}
