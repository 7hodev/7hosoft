"use client";

import React, { useState, useEffect } from "react";
import { useDb } from "@/providers/db-provider";
import { CustomerDetailsSheet } from "@/components/customer/customer-details-sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/utils/format";
import { TransactionsService } from "@/lib/services/transactions.service";

// Extender el tipo de variante del Badge
// Esta es solo una forma de solucionar temporalmente el error, debería modificarse el componente Badge en la fuente
type CustomBadgeVariant = "default" | "destructive" | "outline" | "secondary" | "success";

export function CustomerTable() {
  const { customers, transactions, refreshData } = useDb();

  // Estados para los filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Estado para el cliente seleccionado
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    // Verificar que los clientes tengan información correcta
    if (customers && customers.length > 0) {
      console.log("Detalle de clientes:");
      customers.slice(0, 3).forEach(customer => {
        console.log(`Cliente ${customer.id} - ${customer.name}:`);
        console.log(` - Total gastado: ${customer.total_spent || 0}`);
        console.log(` - Estado: ${customer.status || 'N/A'}`);
        console.log(` - Última interacción: ${customer.last_interaction_at || 'N/A'}`);
      });
    }
  }, [customers]);

  // Función para formatear fecha con zona horaria
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    
    const date = parseISO(dateString);
    return format(date, "dd/MM/yyyy HH:mm", { locale: es });
  };

  // Función para obtener la última transacción de un cliente
  const getLastInteractionDate = (customerId: string) => {
    const customerTransactions = transactions.filter(
      (t) => t.customer_id === customerId
    );
    
    if (customerTransactions.length === 0) {
      return null;
    }
    
    // Ordenar transacciones por fecha (más reciente primero)
    const sortedTransactions = [...customerTransactions].sort(
      (a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
    );
    
    return sortedTransactions[0].sale_date;
  };

  // Filtrar clientes basados en los filtros aplicados
  const filteredCustomers = customers.filter((customer) => {
    // Filtro por búsqueda
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = customer.name?.toLowerCase().includes(searchLower) || false;
      const emailMatch = customer.email?.toLowerCase().includes(searchLower) || false;
      const phoneMatch = customer.phone?.toLowerCase().includes(searchLower) || false;
      
      if (!nameMatch && !emailMatch && !phoneMatch) return false;
    }

    // Filtro por estado
    if (filterStatus !== "all" && customer.status !== filterStatus) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    // Ordenar por ID de forma descendente
    // Convertimos a strings para comparar y aseguramos que los IDs sean válidos
    const idA = String(a.id || '');
    const idB = String(b.id || '');
    // Orden descendente (de mayor a menor)
    return idB.localeCompare(idA);
  });

  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setShowFilters(false);
  };

  const handleRefresh = async () => {
    await refreshData();
    console.log("Datos actualizados");
  };

  console.log("Renderizando tabla con", customers.length, "clientes en total");
  console.log("Clientes filtrados:", filteredCustomers.length);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex flex-col md:flex-row justify-between gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                className="h-10 w-10"
                title="Actualizar datos"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              {(searchQuery || filterStatus !== "all") && (
                <Button variant="outline" size="icon" onClick={resetFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  {isDesktop && <TableHead>Email</TableHead>}
                  {isDesktop && <TableHead>Teléfono</TableHead>}
                  <TableHead>Estado</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Última Transacción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isDesktop ? 6 : 4}
                      className="h-24 text-center"
                    >
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <TableCell className="font-medium">
                        {customer.name}
                      </TableCell>
                      {isDesktop && (
                        <TableCell>{customer.email || "N/A"}</TableCell>
                      )}
                      {isDesktop && (
                        <TableCell>{customer.phone || "N/A"}</TableCell>
                      )}
                      <TableCell>
                        <Badge
                          variant={
                            customer.status === "active" ? "success" : "destructive"
                          }
                        >
                          {customer.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(Number(customer.total_spent) || 0)}
                      </TableCell>
                      <TableCell>
                        {formatDate(customer.last_interaction_at || getLastInteractionDate(customer.id))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* Hoja de detalles del cliente */}
      {selectedCustomerId && (
        <CustomerDetailsSheet
          customerId={selectedCustomerId}
          open={!!selectedCustomerId}
          onOpenChange={(open: boolean) => {
            if (!open) setSelectedCustomerId(null);
          }}
        />
      )}
    </Card>
  );
} 