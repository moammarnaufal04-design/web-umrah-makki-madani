import { Skeleton } from "@/components/ui/skeleton";

export function PackageCardSkeleton() {
  return (
    <div className="card-mm overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-2 gap-2"><Skeleton className="h-3" /><Skeleton className="h-3" /><Skeleton className="h-3" /><Skeleton className="h-3" /></div>
        <Skeleton className="h-8 w-1/2" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="loading-skeleton">
      {Array.from({ length: count }).map((_, i) => <PackageCardSkeleton key={i} />)}
    </div>
  );
}

export function TextSkeleton({ lines = 4 }) {
  return (
    <div className="space-y-3" data-testid="loading-skeleton">
      {Array.from({ length: lines }).map((_, i) => <Skeleton key={i} className="h-4" style={{ width: `${100 - i * 12}%` }} />)}
    </div>
  );
}
