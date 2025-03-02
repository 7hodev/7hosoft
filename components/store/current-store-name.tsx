"use client";

import { useDb } from "@/providers/db-provider";
import { Skeleton } from "@/components/ui/skeleton";

export function CurrentStoreName() {
  const { selectedStore } = useDb();

  return (
    <span className="font-medium">
      {selectedStore?.name || ""}
    </span>
  );
}