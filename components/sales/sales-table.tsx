"use client";

import React from "react";
import { useDb } from "@/providers/db-provider";
import { SalesCreateDialog } from "@/components/sales/sales-create-dialog";
import { SalesEditDialog } from "@/components/sales/sales-edit-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CardTitle } from "../ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SaleStatus } from "@/lib/services/sales.service";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Badge } from "@/components/ui/badge";

export function SalesTable() {
  const { sales, customers, employees, selectedStore, getStatusDisplay, getSaleProducts } = useDb();
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [displaySaleProducts, setDisplaySaleProducts] = useState<Record<string, { product: any; soldProduct: any }[]>>({});
  const [loadingSaleProducts, setLoadingSaleProducts] = useState<Record<string, boolean>>({});
  
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "Cliente desconocido";
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : "Empleado desconocido";
  };

  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return "$0.00";
    return `$${price.toFixed(2)}`;
  };

  const handleRowClick = async (saleId: string) => {
    // Solo necesitamos cargar los productos la primera vez
    if (!displaySaleProducts[saleId]) {
      setLoadingSaleProducts(prev => ({ ...prev, [saleId]: true }));
      try {
        const products = await getSaleProducts(saleId);
        setDisplaySaleProducts(prev => ({ ...prev, [saleId]: products }));
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoadingSaleProducts(prev => ({ ...prev, [saleId]: false }));
      }
    }
    
    // Abrir el diálogo de edición
    setEditingSaleId(saleId);
    setIsEditDialogOpen(true);
  };

  useEffect(() => {
    // Precargar productos para mejorar la experiencia de usuario
    const loadInitialProducts = async () => {
      if (sales.length > 0) {
        for (const sale of sales.slice(0, 5)) { // Solo precargamos los primeros 5 para no sobrecargar
          if (!displaySaleProducts[sale.id]) {
            try {
              const products = await getSaleProducts(sale.id);
              setDisplaySaleProducts(prev => ({ ...prev, [sale.id]: products }));
            } catch (error) {
              console.error(`Error precargando productos para venta ${sale.id}:`, error);
            }
          }
        }
      }
    };
    
    loadInitialProducts();
  }, [sales, getSaleProducts]);

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
              <TableHead>Productos</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No hay ventas registradas
                </TableCell>
              </TableRow>
            ) : (
              sales.map(sale => (
                <TableRow 
                  key={sale.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(sale.id)}
                >
                  <TableCell>
                    {loadingSaleProducts[sale.id] ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        <span className="text-sm text-muted-foreground">Cargando...</span>
                      </div>
                    ) : displaySaleProducts[sale.id]?.length > 0 ? (
                      <div className="space-y-1">
                        {displaySaleProducts[sale.id].slice(0, 2).map(({ product, soldProduct }) => (
                          <div key={soldProduct.id} className="text-sm">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-muted-foreground"> x {soldProduct.quantity}</span>
                          </div>
                        ))}
                        {displaySaleProducts[sale.id].length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{displaySaleProducts[sale.id].length - 2} más
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Cargando productos...</span>
                    )}
                  </TableCell>
                  <TableCell>{getCustomerName(sale.customer_id)}</TableCell>
                  <TableCell className="font-medium">{formatPrice(sale.total_amount)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${
                        sale.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : sale.status === "canceled"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {sale.status === "completed"
                        ? "Completada"
                        : sale.status === "canceled"
                        ? "Cancelada"
                        : "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {editingSaleId && (
        <SalesEditDialog 
          saleId={editingSaleId}
          isOpen={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingSaleId(null);
          }}
        />
      )}
    </div>
  );
}