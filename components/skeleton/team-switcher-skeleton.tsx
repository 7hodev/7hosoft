import { Skeleton } from "@/components/ui/skeleton"

export function TeamSwitcherSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 h-12 w-full">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-3 w-[80px]" />
      </div>
      <Skeleton className="h-4 w-4" />
    </div>
  )
}