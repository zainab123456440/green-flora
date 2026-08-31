import { AlertTriangle } from "lucide-react";
import Button from "./Button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export default function ErrorState({
  message,
  onRetry,
  retryLabel = "Try again",
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-card border border-danger-100 bg-danger-50 px-5 py-4 ${className}`}
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger-500" />
      <div className="flex-1">
        <p className="text-sm text-danger-600">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="text-danger-600 hover:bg-danger-100"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
