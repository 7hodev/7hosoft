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
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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

  const handleRowClick = async (saleId: string) => {
    // Solo necesitamos cargar los productos la primera vez
    if (!displaySaleProducts[saleId]) {
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

    // Abrir el diálogo de edición
    setEditingSaleId(saleId);
    setIsEditDialogOpen(true);
  };

  useEffect(() => {
    // Precargar productos para mejorar la experiencia de usuario
    const loadInitialProducts = async () => {
      if (sales.length > 0) {
        for (const sale of sales.slice(0, 5)) {
          // Solo precargamos los primeros 5 para no sobrecargar
          if (!displaySaleProducts[sale.id]) {
            try {
              const products = await getSaleProducts(sale.id);
              setDisplaySaleProducts((prev) => ({
                ...prev,
                [sale.id]: products,
              }));
            } catch (error) {
              console.error(
                `Error precargando productos para venta ${sale.id}:`,
                error
              );
            }
          }
        }
      }
    };

    loadInitialProducts();
  }, [sales, getSaleProducts]);

  // Función para filtrar las ventas
  const filteredSales = sales.filter((sale) => {
    // Filtrado por búsqueda (cliente, empleado, productos)
    if (searchQuery) {
      const customerName = getCustomerName(sale.customer_id).toLowerCase();
      const employeeName = getEmployeeName(sale.employee_id).toLowerCase();
      const query = searchQuery.toLowerCase();

      // Comprobar si coincide con nombre de cliente o empleado
      const matchesCustomerOrEmployee =
        customerName.includes(query) || employeeName.includes(query);

      // Comprobar si coincide con algún producto
      const matchesProduct = displaySaleProducts[sale.id]?.some(({ product }) =>
        product.name.toLowerCase().includes(query)
      );

      if (!matchesCustomerOrEmployee && !matchesProduct) {
        return false;
      }
    }

    // Filtrado por estado
    if (
      filterStatus &&
      filterStatus !== "all" &&
      sale.status !== filterStatus
    ) {
      return false;
    }

    // Filtrado por fecha
    if (filterDate) {
      // Parsear la fecha de la venta y establecerla al inicio del día
      const saleDate = startOfDay(parseISO(sale.sale_date));

      // Convertir la fecha del filtro a un objeto Date al inicio del día
      // El formato del input date es "YYYY-MM-DD"
      const filterDateObj = startOfDay(
        parse(filterDate, "yyyy-MM-dd", new Date())
      );

      // Comparar si las fechas son iguales (ambas normalizadas al inicio del día)
      if (!isEqual(saleDate, filterDateObj)) {
        return false;
      }
    }

    // Filtrado por producto específico
    if (
      filterProduct &&
      filterProduct !== "all" &&
      !displaySaleProducts[sale.id]?.some(
        ({ product }) => product.id === filterProduct
      )
    ) {
      return false;
    }

    return true;
  });

  const resetFilters = () => {
    setFilterProduct("all");
    setFilterStatus("all");
    setFilterDate("");
  };

  if (!selectedStore) return null;

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-0">
        <h2 className="text-xl font-bold w-1/2">Ventas recientes</h2>

        {/* Controles de filtrado */}
        <div className="flex gap-2 w-full lg:w-1/2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por producto, cliente o empleado..."
              className="pl-8 pr-8 peer"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {/* Elimina la "X" nativa del input */}
            <style>
              {`
                .peer::-webkit-search-decoration,
                .peer::-webkit-search-cancel-button {
                  display: none;
                 }
            `}
            </style>
            {searchQuery && (
              <Button
                variant="ghost"
                type="button"
                size="sm"
                className="absolute right-1 top-1.5 h-6 w-6 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-6 w-6" />
              </Button>
            )}
          </div>

          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button className="gap-1">
                <Filter className="h-4 w-4" />
                Filtros
                {((filterProduct && filterProduct !== "all") ||
                  (filterStatus && filterStatus !== "all") ||
                  filterDate) && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {[
                      filterProduct !== "all" ? 1 : 0,
                      filterStatus !== "all" ? 1 : 0,
                      filterDate ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Filtrar ventas</h4>

                <div className="space-y-2">
                  <Label htmlFor="filterProduct">Producto</Label>
                  <Select
                    value={filterProduct}
                    onValueChange={setFilterProduct}
                  >
                    <SelectTrigger id="filterProduct">
                      <SelectValue placeholder="Selecciona un producto" />
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
                  <Label htmlFor="filterStatus">Estado</Label>
                  <Select
                    value={filterStatus}
                    onValueChange={(value: SaleStatus | "all") =>
                      setFilterStatus(value)
                    }
                  >
                    <SelectTrigger id="filterStatus">
                      <SelectValue placeholder="Cualquier estado" />
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
                  <Label htmlFor="filterDate">Fecha</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="filterDate"
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    {filterDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setFilterDate("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {filterDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Mostrando ventas del{" "}
                      {format(
                        parse(filterDate, "yyyy-MM-dd", new Date()),
                        "dd MMMM yyyy",
                        { locale: es }
                      )}
                    </p>
                  )}
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Limpiar filtros
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

      <div className="">
        <div
          className="overflow-auto"
          style={{ maxHeight: "310px", minHeight: "310px" }}
        >
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
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
                    colSpan={5}
                    className="text-center py-4 text-muted-foreground"
                  >
                    {sales.length === 0
                      ? "No hay ventas registradas"
                      : "No se encontraron resultados con los filtros actuales"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow
                    key={sale.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(sale.id)}
                  >
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
                      {format(parseISO(sale.sale_date), "dd/MM/yyyy", {
                        locale: es,
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
    </Card>
  );
}
