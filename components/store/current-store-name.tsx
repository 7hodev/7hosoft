"use client";

import { useStore } from "@/app/context/store-context";
import { Skeleton } from "@/components/ui/skeleton";

export function CurrentStoreName() {
  const { selectedStore, isLoading } = useStore();
  
  if (isLoading) {
    return <Skeleton className="h-6 w-40" />;
  }

  return (
    <span className="font-medium">
      {selectedStore?.name || "Selecciona una tienda"}
    </span>
  );
}