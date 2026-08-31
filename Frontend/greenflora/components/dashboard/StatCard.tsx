import type { ReactNode } from "react";
import Card from "@/components/ui/Card";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  hint?: string;
}

export default function StatCard({ label, value, icon, hint }: StatCardProps) {
  return (
    <Card padding="sm" className="animate-gf-fade-in">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-neutral-500">{label}</p>
          <p className="mt-0.5 text-lg font-semibold text-neutral-900 truncate">
            {value}
          </p>
          {hint && (
            <p className="mt-0.5 text-[11px] text-neutral-400">{hint}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
