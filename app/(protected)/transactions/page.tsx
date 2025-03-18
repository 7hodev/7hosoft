"use client";

import { useDb } from "@/providers/db-provider";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import TransactionsStatistic from "@/components/transactions/transactions-stadistic";
import { TransactionsCreateDialog } from "@/components/transactions/transactions-create-dialog";

export default function TransactionsPage() {
  const { stores, loading } = useDb();

  if (loading) return <div>Cargando...</div>;
  if (!stores.length) return <div>No hay tiendas registradas</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Transacciones</h2>
        <TransactionsCreateDialog />
      </div>
      <TransactionsStatistic />
      <TransactionsTable />
    </div>
  );
} 