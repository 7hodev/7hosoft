"use client";

import React, { useState } from "react";
import { useDb } from "@/providers/db-provider";
import { TransactionsCreateSheet } from "@/components/transactions/transactions-create-sheet";
import { TransactionDetailsSheet } from "@/components/transactions/transactions-details-sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { TransactionStatus, TransactionType, TransactionsService } from "@/lib/services/transactions.service";
import { Search, Filter, X, Calendar } from "lucide-react";
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
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { toZonedTime } from 'date-fns-tz';

export function TransactionsTable() {
  const {
    transactions,
    customers,
    employees,
    selectedStore,
    products,
  } = useDb();

  // Estados para los filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | "all">("all");
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDate, setFilterDate] = useState("");
  
  // Estado para la transacción seleccionada
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Función para formatear fecha en zona horaria local
  const formatDate = (dateString: string) => {
    return TransactionsService.formatLocalDate(dateString, "dd/MM/yyyy HH:mm");
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : "Cliente desconocido";
  };

  const formatPrice = (price: number | null | undefined, type: TransactionType): string => {
    if (price === null || price === undefined) return "$0.00";
    return type === 'income' ? `+$${price.toFixed(2)}` : `-$${price.toFixed(2)}`;
  };

  const getCategoryDisplayName = (category: string): string => {
    const categoryMap: Record<string, string> = {
      // Ingresos
      "sales": "Ventas",
      "services": "Servicios",
      "investment_returns": "Retornos de inversión",
      "interest_income": "Ingresos por intereses",
      "rental_income": "Ingresos por alquiler",
      "refunds_received": "Reembolsos recibidos",
      "other_income": "Otros ingresos",
      // Gastos
      "cost_of_goods_sold": "Costo de ventas",
      "salaries_wages": "Salarios",
      "rent": "Alquiler",
      "utilities": "Servicios",
      "office_supplies": "Suministros de oficina",
      "marketing": "Marketing",
      "travel": "Viajes",
      "insurance": "Seguros",
      "professional_services": "Servicios profesionales",
      "equipment": "Equipamiento",
      "maintenance": "Mantenimiento",
      "taxes": "Impuestos",
      "refunds_issued": "Reembolsos emitidos",
      "other_expenses": "Otros gastos"
    };
    
    return categoryMap[category] || category;
  };

  // Filtrar transacciones basadas en los filtros aplicados
  const filteredTransactions = transactions.filter((transaction) => {
    // Filtro por búsqueda
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const descriptionMatch = transaction.description?.toLowerCase().includes(searchLower) || false;
      const categoryMatch = getCategoryDisplayName(transaction.category)?.toLowerCase().includes(searchLower) || false;
      
      if (!descriptionMatch && !categoryMatch) return false;
    }

    // Filtro por estado
    if (filterStatus !== "all" && transaction.status !== filterStatus) {
      return false;
    }

    // Filtro por tipo
    if (filterType !== "all" && transaction.type !== filterType) {
      return false;
    }

    // Filtro por categoría
    if (filterCategory !== "all" && transaction.category !== filterCategory) {
      return false;
    }

    // Filtro por fecha
    if (filterDate) {
      try {
        const localDate = TransactionsService.convertToLocalDate(transaction.sale_date);
        const transactionDateStr = format(localDate, "yyyy-MM-dd");
        if (transactionDateStr !== filterDate) {
          return false;
        }
      } catch (error) {
        return true;
      }
    }

    return true;
  });

  // Definir las columnas para la tabla
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "sale_date",
      header: "Fecha",
      cell: ({ row }) => {
        return formatDate(row.original.sale_date);
      },
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <Badge
            className={`${
              type === "income"
                ? "bg-green-100 hover:bg-green-200 text-green-700"
                : "bg-red-100 hover:bg-red-200 text-red-700"
            }`}
          >
            {type === "income" ? "Ingreso" : "Gasto"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => {
        return <span className="max-w-[200px] truncate">{row.original.description || "-"}</span>;
      },
    },
    {
      accessorKey: "category",
      header: "Categoría",
      cell: ({ row }) => {
        return getCategoryDisplayName(row.original.category);
      },
    },
    {
      accessorKey: "total_amount",
      header: "Monto",
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <span className={`font-medium ${
            type === "income" ? "text-green-600" : "text-red-600"
          }`}>
            {formatPrice(row.original.total_amount, type)}
          </span>
        );
      },
    },
  ];

  // Configurar la tabla con TanStack Table
  const table = useReactTable({
    data: filteredTransactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Memoizar solo las transacciones filtradas para evitar ciclos de renderizado
  const memoizedFilteredTransactions = React.useMemo(() => filteredTransactions, [filteredTransactions]);

  // Restablecer todos los filtros
  const resetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterCategory("all");
    setFilterStatus("all");
    setFilterDate("");
    setShowFilters(false);
  };
  
  // Función para refrescar datos después de editar o eliminar
  const handleTransactionUpdate = () => {
    setSelectedTransactionId(null);
  };

  if (!selectedStore) return null;

  return (
    <Card className="col-span-3">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <CardTitle className="text-2xl">Transacciones</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar transacciones..."
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
                  {(filterType !== "all" ||
                    filterCategory !== "all" ||
                    filterStatus !== "all" ||
                    filterDate) && (
                    <Badge className="ml-2 bg-primary text-white" variant="default">
                      {[
                        filterType !== "all" ? 1 : 0,
                        filterCategory !== "all" ? 1 : 0,
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
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={filterType}
                      onValueChange={(value) =>
                        setFilterType(value as TransactionType | "all")
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="income">Ingreso</SelectItem>
                        <SelectItem value="expense">Gasto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={filterStatus}
                      onValueChange={(value) =>
                        setFilterStatus(value as TransactionStatus | "all")
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
                        <SelectItem value="refunded">Reembolsada</SelectItem>
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
      <CardContent className="p-0">
        <div className="overflow-auto min-h-[300px] max-h-[320px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                {table.getHeaderGroups().map((headerGroup) => (
                  headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {memoizedFilteredTransactions.length ? (
                memoizedFilteredTransactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedTransactionId(transaction.id)}
                  >
                    <TableCell>
                      {formatDate(transaction.sale_date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          transaction.type === "income"
                            ? "bg-green-100 hover:bg-green-200 text-green-700"
                            : "bg-red-100 hover:bg-red-200 text-red-700"
                        }`}
                      >
                        {transaction.type === "income" ? "Ingreso" : "Gasto"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {transaction.description || "-"}
                    </TableCell>
                    <TableCell>
                      {getCategoryDisplayName(transaction.category)}
                    </TableCell>
                    <TableCell className={`font-medium ${
                      transaction.type === "income" ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatPrice(transaction.total_amount, transaction.type)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-4 text-muted-foreground"
                  >
                    {transactions.length === 0
                      ? "No hay transacciones registradas"
                      : "No se encontraron resultados con los filtros actuales"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Componente de detalles de transacción */}
      <TransactionDetailsSheet
        transactionId={selectedTransactionId}
        onOpenChange={(open) => {
          if (!open) setSelectedTransactionId(null);
        }}
        onUpdate={handleTransactionUpdate}
      />
    </Card>
  );
}