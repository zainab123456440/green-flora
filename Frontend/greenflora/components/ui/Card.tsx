import type { ReactNode } from "react";

type CardVariant = "default" | "elevated" | "outlined";

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-surface-card shadow-card border border-neutral-200",
  elevated: "bg-surface-elevated shadow-elevated border border-neutral-200",
  outlined: "bg-surface-card border border-neutral-200",
};

const paddingStyles: Record<string, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  variant = "default",
  className = "",
  padding = "md",
}: CardProps) {
  return (
    <div
      className={`rounded-card ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
