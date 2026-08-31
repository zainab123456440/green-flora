import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import Card from "@/components/ui/Card";

interface ComingSoonCardProps {
  title: string;
  icon: ReactNode;
  description?: string;
}

export default function ComingSoonCard({
  title,
  icon,
  description = "This feature will be available in a future update.",
}: ComingSoonCardProps) {
  return (
    <Card padding="sm" className="animate-gf-fade-in">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
          </div>
          <p className="mt-1 text-xs text-neutral-400">{description}</p>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-neutral-400">
            <Clock className="h-3 w-3" />
            <span>Coming soon</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
