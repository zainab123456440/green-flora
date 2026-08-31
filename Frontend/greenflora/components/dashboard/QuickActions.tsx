import Link from "next/link";
import Button from "@/components/ui/Button";

interface QuickAction {
  label: string;
  href: string;
  enabled: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export default function QuickActions({ actions }: QuickActionsProps) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800">
        Quick actions
      </h2>
      <div className="flex flex-wrap gap-2.5">
        {actions.map((action) =>
          action.enabled ? (
            <Link key={action.href} href={action.href}>
              <Button variant="primary" size="sm">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              key={action.href}
              variant="secondary"
              size="sm"
              disabled
              title="Coming soon"
            >
              {action.label}
            </Button>
          )
        )}
      </div>
    </section>
  );
}
