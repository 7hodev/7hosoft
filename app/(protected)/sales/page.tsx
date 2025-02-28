"use client";

import { useDb } from "@/providers/db-provider";
import { SalesTable } from "@/components/sales/sales-table";

export default function SalesPage() {
  const { stores, loading } = useDb();

  if (loading) return <div>Cargando...</div>;
  if (!stores.length) return <div>No hay tiendas registradas</div>;

  return (
    <div className="p-8">
      <SalesTable />
    </div>
  );
}
