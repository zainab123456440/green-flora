interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  className = "",
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const barColor =
    percentage >= 80
      ? "bg-primary-600"
      : percentage >= 50
        ? "bg-primary-400"
        : "bg-amber-500";

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium text-neutral-600">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-xs font-semibold text-neutral-700">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
