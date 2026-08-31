import type { ReactNode } from "react";

interface ProfileSectionProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function ProfileSection({
  title,
  children,
  action,
  className = "",
}: ProfileSectionProps) {
  return (
    <section
      className={`rounded-card border border-neutral-200 bg-surface-card ${className}`}
    >
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
