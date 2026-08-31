type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary-100 text-primary-800",
  success: "bg-success-100 text-success-600",
  warning: "bg-amber-100 text-amber-600",
  danger: "bg-danger-100 text-danger-600",
  info: "bg-info-100 text-info-600",
  neutral: "bg-neutral-100 text-neutral-600",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-badge px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
