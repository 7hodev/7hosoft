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
import { Product, ProductsService } from "@/lib/services/products.service";
import { SoldProduct } from "@/lib/services/sold_products.service";
import { ChevronDown, ChevronRight } from "lucide-react";

type SaleProductDetails = {
  product: Product;
  soldProduct: SoldProduct;
};

export function SalesTable() {
  const { sales, customers, employees, selectedStore, getStatusDisplay, getSaleProducts } = useDb();
  const [expandedSales, setExpandedSales] = useState<Record<string, boolean>>({});
  const [saleProducts, setSaleProducts] = useState<Record<string, SaleProductDetails[]>>({});
  const [loadingSaleProducts, setLoadingSaleProducts] = useState<Record<string, boolean>>({});

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || "N/A";
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(e => e.id === employeeId)?.name || "N/A";
  };

  // Función para formatear precios de manera segura
  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return "$0.00";
    return `$${Number(price).toFixed(2)}`;
  };

  // Función para calcular subtotal de manera segura
  const calculateSubtotal = (price: number | null | undefined, quantity: number | null | undefined): string => {
    if (!price || !quantity) return "$0.00";
    return `$${(Number(price) * Number(quantity)).toFixed(2)}`;
  };

  const toggleSaleExpanded = async (saleId: string) => {
    const newExpandedState = !expandedSales[saleId];
    setExpandedSales(prev => ({ ...prev, [saleId]: newExpandedState }));
    
    // Si estamos expandiendo y no tenemos los productos cargados, los cargamos
    if (newExpandedState && !saleProducts[saleId]) {
      loadSaleProducts(saleId);
    }
  };

  const loadSaleProducts = async (saleId: string) => {
    if (loadingSaleProducts[saleId]) return;
    
    setLoadingSaleProducts(prev => ({ ...prev, [saleId]: true }));
    
    try {
      const products = await getSaleProducts(saleId);
      console.log('Productos cargados para venta', saleId, products);
      setSaleProducts(prev => ({ ...prev, [saleId]: products }));
    } catch (error) {
      console.error("Error cargando productos de la venta:", error);
    } finally {
      setLoadingSaleProducts(prev => ({ ...prev, [saleId]: false }));
    }
  };

  // Debug: Mostrar en consola cuando cambia el estado de los productos
  useEffect(() => {
    Object.entries(saleProducts).forEach(([saleId, products]) => {
      console.log(`Productos para venta ${saleId}:`, products);
    });
  }, [saleProducts]);

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
                <React.Fragment key={`sale-group-${sale.id}`}>
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
                        return <span className={status.className}>{status.text}</span>;
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
                    <TableRow key={`sale-details-${sale.id}`}>
                      <TableCell colSpan={6} className="p-0">
                        <div className="bg-gray-50 px-4 py-2">
                          <h4 className="font-medium mb-2">Productos</h4>
                          
                          {loadingSaleProducts[sale.id] ? (
                            <div className="text-center py-2">Cargando productos...</div>
                          ) : saleProducts[sale.id]?.length ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Producto</TableHead>
                                  <TableHead>Cantidad</TableHead>
                                  <TableHead>Precio Unitario</TableHead>
                                  <TableHead>Subtotal</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {saleProducts[sale.id].map(({ product, soldProduct }) => {
                                  // Usar el precio del producto si el precio de soldProduct es 0 o nulo
                                  const price = soldProduct?.price || product?.price || 0;
                                  const quantity = soldProduct?.quantity || 0;
                                  
                                  return (
                                    <TableRow key={`sold-product-${soldProduct.id}`}>
                                      <TableCell>{product?.name || "Producto desconocido"}</TableCell>
                                      <TableCell>{quantity}</TableCell>
                                      <TableCell>{formatPrice(price)}</TableCell>
                                      <TableCell>{calculateSubtotal(price, quantity)}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="text-center py-2 text-gray-500">No hay productos registrados para esta venta</div>
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