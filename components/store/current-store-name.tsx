"use client";

import { useDb } from "@/providers/db-provider";
import { Skeleton } from "@/components/ui/skeleton";

export function CurrentStoreName() {
  const { selectedStore, loading } = useDb();

  if (loading) {
    return <Skeleton className="h-4 w-[120px]" />;
  }

  return (
    <span className="font-medium">
      {selectedStore?.name || ""}
    </span>
  );
}