"use client";

import { useDb } from "@/providers/db-provider";
import { SalesTable } from "@/components/sales/sales-table";
import SalesStadistic from "@/components/sales/sales-stadistic";
import { SalesCreateDialog } from "@/components/sales/sales-create-dialog";

export default function SalesPage() {
  const { stores, loading } = useDb();

  if (loading) return <div>Cargando...</div>;
  if (!stores.length) return <div>No hay tiendas registradas</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ventas</h2>
        <SalesCreateDialog />
      </div>
      <SalesStadistic />
      <SalesTable />
    </div>
  );
}
