import { User } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import Badge from "@/components/ui/Badge";

interface ProfileHeaderProps {
  name: string;
  completeness: number;
  isDemo?: boolean;
}

export default function ProfileHeader({
  name,
  completeness,
  isDemo,
}: ProfileHeaderProps) {
  return (
    <div className="mb-6 animate-gf-fade-in">
      <div className="flex flex-wrap items-start gap-4">
        {/* Avatar */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <User className="h-7 w-7" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              {name}
            </h1>
            {isDemo && <Badge variant="warning">Demo profile</Badge>}
          </div>

          <div className="mt-3 max-w-xs">
            <ProgressBar
              value={completeness}
              label="Profile completeness"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
