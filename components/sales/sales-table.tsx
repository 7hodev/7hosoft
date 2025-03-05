"use client";

import React from "react";
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
import { SaleStatus } from "@/lib/services/sales.service";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function SalesTable() {
  const { sales, customers, employees, selectedStore, getStatusDisplay, getSaleProducts } = useDb();
  const [expandedSales, setExpandedSales] = useState<Record<string, boolean>>({});
  const [saleProducts, setSaleProducts] = useState<Record<string, any[]>>({});
  const [loadingSaleProducts, setLoadingSaleProducts] = useState<Record<string, boolean>>({});

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || "N/A";
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(e => e.id === employeeId)?.name || "N/A";
  };

  const formatPrice = (price: number | null | undefined): string => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(price || 0));
  };

  const toggleSaleExpanded = async (saleId: string) => {
    const newExpandedState = !expandedSales[saleId];
    setExpandedSales(prev => ({ ...prev, [saleId]: newExpandedState }));
    
    if (newExpandedState && !saleProducts[saleId]) {
      setLoadingSaleProducts(prev => ({ ...prev, [saleId]: true }));
      try {
        const products = await getSaleProducts(saleId);
        setSaleProducts(prev => ({ ...prev, [saleId]: products }));
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoadingSaleProducts(prev => ({ ...prev, [saleId]: false }));
      }
    }
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
              <TableHead className="w-10"></TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales
              .filter(sale => sale.store_id === selectedStore.id)
              .map((sale) => (
                <React.Fragment key={sale.id}>
                  <TableRow 
                    className="cursor-pointer hover:bg-gray-50" 
                    onClick={() => toggleSaleExpanded(sale.id)}
                  >
                    <TableCell className="p-2">
                      {expandedSales[sale.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = getStatusDisplay(sale.status as SaleStatus);
                        return (
                          <span className={`font-medium rounded-full px-2 py-1 ${status.className}`}>
                            {status.text}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>{getCustomerName(sale.customer_id)}</TableCell>
                    <TableCell>{formatPrice(sale.total_amount)}</TableCell>
                    <TableCell>{getEmployeeName(sale.employee_id)}</TableCell>
                    <TableCell>
                      {format(new Date(sale.sale_date), "HH:mm - dd/MM/yyyy", { locale: es })}
                    </TableCell>
                  </TableRow>
                  
                  {expandedSales[sale.id] && (
                    <TableRow key={`details-${sale.id}`}>
                      <TableCell colSpan={6} className="p-0">
                        <div className="bg-gray-50 px-4 py-2">
                          <h4 className="font-medium mb-2">Productos vendidos</h4>
                          {loadingSaleProducts[sale.id] ? (
                            <div className="text-center py-2">Cargando productos...</div>
                          ) : saleProducts[sale.id]?.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Producto</TableHead>
                                  <TableHead className="text-right">Cantidad</TableHead>
                                  <TableHead className="text-right">Precio Unitario</TableHead>
                                  <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {saleProducts[sale.id].map(({ product, soldProduct }) => {
                                  const price = Number(soldProduct.price) || 0;
                                  const quantity = Number(soldProduct.quantity) || 0;
                                  const subtotal = price * quantity;

                                  return (
                                    <TableRow key={soldProduct.id}>
                                      <TableCell>{product?.name || "Producto no encontrado"}</TableCell>
                                      <TableCell className="text-right">{quantity}</TableCell>
                                      <TableCell className="text-right">{formatPrice(price)}</TableCell>
                                      <TableCell className="text-right font-medium">
                                        {formatPrice(subtotal)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                <TableRow>
                                  <TableCell colSpan={3} className="text-right font-medium">
                                    Total general
                                  </TableCell>
                                  <TableCell className="text-right font-medium text-green-600">
                                    {formatPrice(sale.total_amount)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="text-center py-2 text-gray-500">
                              No se encontraron productos registrados
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}