"use client";

import { useDb } from "@/providers/db-provider";
import { SalesCreateDialog } from "@/components/sales/sales-create-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function SalesTable() {
  const { sales, employees, customers, selectedStore } = useDb();

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || "N/A";
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : "N/A";
  };

  if (!selectedStore) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Ventas de {selectedStore.name}</h2>
        <SalesCreateDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Empleado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales
              .filter(sale => sale.store_id === selectedStore.id)
              .map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {format(new Date(sale.sale_date), "dd/MM/yyyy HH:mm", { locale: es })}
                  </TableCell>
                  <TableCell>${sale.total_amount.toFixed(2)}</TableCell>
                  <TableCell>{getCustomerName(sale.customer_id)}</TableCell>
                  <TableCell>{getEmployeeName(sale.employee_id)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}