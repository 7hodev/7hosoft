"use client";

import { useDb } from "@/providers/db-provider";
import { CustomerTable } from "@/components/customer/customer-table";
import CustomerStatistic from "@/components/customer/customer-statistic";
import { CustomerCreateSheet } from "@/components/customer/customer-create-sheet";

export default function CustomerPage() {
  const { stores, loading } = useDb();

  if (loading) return <div>Cargando...</div>;
  if (!stores.length) return <div>No hay tiendas registradas</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Clientes</h2>
        <CustomerCreateSheet />
      </div>
      <CustomerStatistic />
      <CustomerTable />
    </div>
  );
}