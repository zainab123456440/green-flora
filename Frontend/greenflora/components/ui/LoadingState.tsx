interface LoadingStateProps {
  message?: string;
  className?: string;
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-4 rounded bg-neutral-200 animate-gf-pulse ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-card border border-neutral-200 bg-surface-card p-5">
      <SkeletonLine className="mb-4 h-5 w-1/3" />
      <div className="space-y-3">
        <div className="flex justify-between">
          <SkeletonLine className="w-1/4" />
          <SkeletonLine className="w-1/3" />
        </div>
        <div className="flex justify-between">
          <SkeletonLine className="w-1/4" />
          <SkeletonLine className="w-2/5" />
        </div>
        <div className="flex justify-between">
          <SkeletonLine className="w-1/4" />
          <SkeletonLine className="w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-card border border-neutral-200 bg-surface-card p-5">
      <SkeletonLine className="mb-3 h-3 w-1/2" />
      <SkeletonLine className="h-7 w-2/3" />
    </div>
  );
}

export default function LoadingState({
  message = "Loading…",
  className = "",
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-700" />
      <p className="text-sm text-neutral-500">{message}</p>
    </div>
  );
}
