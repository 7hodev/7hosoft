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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parse, isEqual, parseISO, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { SaleStatus } from "@/lib/services/sales.service";
import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Search,
  Filter,
  X,
  Calendar,
  PencilLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function SalesTable() {
  const {
    sales,
    customers,
    employees,
    selectedStore,
    getStatusDisplay,
    getSaleProducts,
    products,
  } = useDb();
  const [expandedSales, setExpandedSales] = useState<Record<string, boolean>>({});
  const [displaySaleProducts, setDisplaySaleProducts] = useState<
    Record<string, { product: any; soldProduct: any }[]>
  >({});
  const [loadingSaleProducts, setLoadingSaleProducts] = useState<
    Record<string, boolean>
  >({});

  // Estados para los filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterStatus, setFilterStatus] = useState<SaleStatus | "all">("all");
  const [filterDate, setFilterDate] = useState("");

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : "Cliente desconocido";
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? employee.name : "Empleado desconocido";
  };

  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return "$0.00";
    return `$${price.toFixed(2)}`;
  };

  const toggleRowExpanded = async (saleId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se propague al onClick de la fila
    
    // Si no está cargado y no se está cargando, cargar los productos
    if (!displaySaleProducts[saleId] && !loadingSaleProducts[saleId]) {
      setLoadingSaleProducts((prev) => ({ ...prev, [saleId]: true }));
      try {
        const products = await getSaleProducts(saleId);
        setDisplaySaleProducts((prev) => ({ ...prev, [saleId]: products }));
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoadingSaleProducts((prev) => ({ ...prev, [saleId]: false }));
      }
    }
    
    // Alternar el estado expandido
    setExpandedSales(prev => ({
      ...prev,
      [saleId]: !prev[saleId]
    }));
  };

  useEffect(() => {
    // Precargar productos para mejorar la experiencia de usuario
    const loadInitialProducts = async () => {
      if (sales.length > 0) {
        const firstSaleId = sales[0].id;
        if (!displaySaleProducts[firstSaleId]) {
          setLoadingSaleProducts((prev) => ({ ...prev, [firstSaleId]: true }));
          try {
            const products = await getSaleProducts(firstSaleId);
            setDisplaySaleProducts((prev) => ({
              ...prev,
              [firstSaleId]: products,
            }));
          } catch (error) {
            console.error("Error cargando productos:", error);
          } finally {
            setLoadingSaleProducts((prev) => ({
              ...prev,
              [firstSaleId]: false,
            }));
          }
        }
      }
    };

    loadInitialProducts();
  }, [sales, getSaleProducts]);

  // Filtrar ventas basadas en los filtros aplicados
  const filteredSales = sales.filter((sale) => {
    // Filtro por búsqueda (cliente o productos)
    if (searchQuery) {
      const customer = customers.find((c) => c.id === sale.customer_id);
      const customerName = customer ? customer.name.toLowerCase() : "";
      const searchLower = searchQuery.toLowerCase();

      // Comprobar si el nombre del cliente coincide
      const customerMatch = customerName.includes(searchLower);

      // Comprobar si algún producto coincide
      const saleProductsData = displaySaleProducts[sale.id];
      const productsMatch =
        saleProductsData &&
        saleProductsData.some(({ product }) =>
          product.name.toLowerCase().includes(searchLower)
        );

      if (!customerMatch && !productsMatch) return false;
    }

    // Filtro por estado
    if (filterStatus !== "all" && sale.status !== filterStatus) {
      return false;
    }

    // Filtro por producto específico
    if (
      filterProduct !== "all" &&
      (!displaySaleProducts[sale.id] ||
        !displaySaleProducts[sale.id].some(
          ({ product }) => product.id === filterProduct
        ))
    ) {
      return false;
    }

    // Filtro por fecha
    if (filterDate) {
      const saleDate = startOfDay(parseISO(sale.sale_date));
      const selectedDate = startOfDay(parse(filterDate, "yyyy-MM-dd", new Date()));
      if (!isEqual(saleDate, selectedDate)) {
        return false;
      }
    }

    return true;
  });

  // Restablecer todos los filtros
  const resetFilters = () => {
    setSearchQuery("");
    setFilterProduct("all");
    setFilterStatus("all");
    setFilterDate("");
    setShowFilters(false);
  };

  if (!selectedStore) return null;

  return (
    <Card className="col-span-3">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <CardTitle className="text-2xl">Ventas</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar ventas..."
                className="pl-8 w-full md:w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="h-4 w-4 mr-2" /> Filtros
                  {(filterProduct !== "all" ||
                    filterStatus !== "all" ||
                    filterDate) && (
                    <Badge className="ml-2 bg-primary text-white" variant="default">
                      {[
                        filterProduct !== "all" ? 1 : 0,
                        filterStatus !== "all" ? 1 : 0,
                        filterDate ? 1 : 0,
                      ].reduce((a, b) => a + b, 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Filtrar por</h4>
                  <div className="space-y-2">
                    <Label htmlFor="product">Producto</Label>
                    <Select
                      value={filterProduct}
                      onValueChange={setFilterProduct}
                    >
                      <SelectTrigger id="product">
                        <SelectValue placeholder="Todos los productos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los productos</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={filterStatus}
                      onValueChange={(value) =>
                        setFilterStatus(value as SaleStatus | "all")
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                        <SelectItem value="canceled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date"
                        type="date"
                        className="pl-8"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                      />
                      {filterDate && (
                        <button
                          type="button"
                          onClick={() => setFilterDate("")}
                          className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                    >
                      Reset
                    </Button>
                    <Button size="sm" onClick={() => setShowFilters(false)}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <div className="">
        <div
          className="overflow-auto"
          style={{ maxHeight: "310px", minHeight: "310px" }}
        >
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-4 text-muted-foreground"
                  >
                    {sales.length === 0
                      ? "No hay ventas registradas"
                      : "No se encontraron resultados con los filtros actuales"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <React.Fragment key={sale.id}>
                    <SalesEditDialog saleId={sale.id}>
                      <TableRow className="hover:bg-muted/50 cursor-pointer">
                        <TableCell className="w-6" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={(e) => toggleRowExpanded(sale.id, e)}
                          >
                            {expandedSales[sale.id] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {loadingSaleProducts[sale.id] ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                              <span className="text-sm text-muted-foreground">
                                Cargando...
                              </span>
                            </div>
                          ) : displaySaleProducts[sale.id]?.length > 0 ? (
                            <div className="flex gap-2 items-center">
                              {displaySaleProducts[sale.id]
                                .slice(0, 2)
                                .map(({ product, soldProduct }) => (
                                  <div
                                    key={soldProduct.id}
                                    className="flex items-center text-sm"
                                  >
                                    <span className="font-medium">
                                      {product.name}
                                    </span>
                                    <span className="text-muted-foreground">
                                      &nbsp; x {soldProduct.quantity}
                                    </span>
                                  </div>
                                ))}
                              {displaySaleProducts[sale.id].length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{displaySaleProducts[sale.id].length - 2} más
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Cargando productos...
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{getCustomerName(sale.customer_id)}</TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(sale.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              sale.status === "completed"
                                ? "bg-green-100 hover:bg-green-200 text-green-700"
                                : sale.status === "canceled"
                                  ? "bg-red-100 hover:bg-red-200 text-red-700"
                                  : "bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
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
                          {format(parseISO(sale.sale_date), "dd/MM/yyyy", {
                            locale: es,
                          })}
                        </TableCell>
                      </TableRow>
                    </SalesEditDialog>
                    {expandedSales[sale.id] && displaySaleProducts[sale.id] && (
                      <TableRow>
                        <TableCell></TableCell>
                        <TableCell colSpan={5} className="bg-muted/30 pb-3">
                          <div className="p-2">
                            <h4 className="text-sm font-medium mb-2">Detalles de la venta</h4>
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Cliente:</span>
                                  <div className="font-medium">{getCustomerName(sale.customer_id)}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Empleado:</span>
                                  <div className="font-medium">{getEmployeeName(sale.employee_id)}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Estado:</span>
                                  <div className="font-medium">
                                    {sale.status === "completed"
                                      ? "Completada"
                                      : sale.status === "canceled"
                                        ? "Cancelada"
                                        : "Pendiente"}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Método de pago:</span>
                                  <div className="font-medium capitalize">
                                    {sale.payment_method === "cash"
                                      ? "Efectivo"
                                      : sale.payment_method === "credit_card"
                                        ? "Tarjeta de crédito"
                                        : sale.payment_method || "No especificado"}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-3">
                                <span className="text-muted-foreground text-sm">Productos:</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                                  {displaySaleProducts[sale.id].map(({ product, soldProduct }) => (
                                    <div key={soldProduct.id} className="text-sm bg-background rounded-md p-2 flex justify-between">
                                      <div>
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-muted-foreground">Cantidad: {soldProduct.quantity}</div>
                                      </div>
                                      <div className="text-right">
                                        <div>${product.price.toFixed(2)}</div>
                                        <div className="font-medium">${(product.price * soldProduct.quantity).toFixed(2)}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {sale.sale_description && (
                                <div className="mt-2">
                                  <span className="text-muted-foreground text-sm">Descripción:</span>
                                  <div className="text-sm mt-1 p-2 bg-background rounded-md">
                                    {sale.sale_description}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex justify-end pt-2">
                                <SalesEditDialog saleId={sale.id}>
                                  <Button size="sm">Editar venta</Button>
                                </SalesEditDialog>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
