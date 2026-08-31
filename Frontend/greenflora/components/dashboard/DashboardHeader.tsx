import Badge from "@/components/ui/Badge";

interface DashboardHeaderProps {
  farmerName: string;
  isDemo?: boolean;
}

export default function DashboardHeader({
  farmerName,
  isDemo,
}: DashboardHeaderProps) {
  const firstName = farmerName.split(" ")[0];
  const today = new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Assalam-o-Alaikum, {firstName}
        </h1>
        {isDemo && <Badge variant="warning">Demo data</Badge>}
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        {today} &mdash; Here&apos;s how your farm looks today.
      </p>
    </div>
  );
}
