"use client";

import React, { useEffect, useState } from "react";
import { useDb } from "@/providers/db-provider";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/utils/format";
import { CustomerEditSheet } from "@/components/customer/customer-edit-sheet";
import { TransactionDetailsSheet } from "@/components/transactions/transactions-details-sheet";
import { TransactionsService } from "@/lib/services/transactions.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, XCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CustomerDetailsSheetProps {
  customerId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function CustomerDetailsSheet({
  customerId,
  open,
  onOpenChange,
  children,
}: CustomerDetailsSheetProps) {
  const { customers, transactions, refreshData } = useDb();
  const [internalOpen, setInternalOpen] = useState(false);
  const [customer, setCustomer] = useState<any | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const isOpen = open !== undefined ? open : internalOpen;

  const handleOpenChange = (value: boolean) => {
    setInternalOpen(value);
    if (onOpenChange) {
      onOpenChange(value);
    }
  };

  useEffect(() => {
    if (isOpen && customerId) {
      const foundCustomer = customers.find((c) => c.id === customerId);
      setCustomer(foundCustomer || null);

      // Filtrar las transacciones del cliente
      const foundTransactions = transactions.filter(
        (t) => t.customer_id === customerId
      );
      setCustomerTransactions(foundTransactions);
    }
  }, [isOpen, customerId, customers, transactions]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();

      // Eliminar sin validar si tiene transacciones
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);

      if (error) throw error;

      await refreshData();
      handleOpenChange(false);
      toast.success("Cliente eliminado correctamente");
    } catch (error: any) {
      console.error("Error al eliminar cliente:", error);
      toast.error(
        `Error al eliminar cliente: ${
          error.message || "Ocurrió un error desconocido"
        }`
      );
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
  };

  // Renderizar el contenido del sheet
  const renderContent = () => {
    if (!customer) return <div>Cargando...</div>;

    return (
      <div className="space-y-6">
        {/* Información básica del cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Nombre:</span> {customer.name}
              </div>
              {customer.email && (
                <div>
                  <span className="font-medium">Email:</span> {customer.email}
                </div>
              )}
              {customer.phone && (
                <div>
                  <span className="font-medium">Teléfono:</span> {customer.phone}
                </div>
              )}
              <div>
                <span className="font-medium">Estado:</span>{" "}
                <Badge
                  variant={customer.status === "active" ? "success" : "secondary"}
                >
                  {customer.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Fecha de Registro:</span>{" "}
                {customer.registered_at
                  ? TransactionsService.formatLocalDate(customer.registered_at)
                  : customer.created_at 
                  ? TransactionsService.formatLocalDate(customer.created_at)
                  : "N/A"}
              </div>
              <div>
                <span className="font-medium">Última Interacción:</span>{" "}
                {customer.last_interaction_at
                  ? TransactionsService.formatLocalDate(customer.last_interaction_at)
                  : "Sin interacciones"}
              </div>
              <div>
                <span className="font-medium">Total Gastado:</span>{" "}
                {formatCurrency(customer.total_spent || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalles Adicionales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.country && (
                <div>
                  <span className="font-medium">País:</span> {customer.country}
                </div>
              )}
              {customer.state && (
                <div>
                  <span className="font-medium">Estado/Provincia:</span>{" "}
                  {customer.state}
                </div>
              )}
              {customer.district && (
                <div>
                  <span className="font-medium">Distrito:</span>{" "}
                  {customer.district}
                </div>
              )}
              {customer.sub_district && (
                <div>
                  <span className="font-medium">Subdistrito:</span>{" "}
                  {customer.sub_district}
                </div>
              )}
              {customer.neighborhood && (
                <div>
                  <span className="font-medium">Vecindario:</span>{" "}
                  {customer.neighborhood}
                </div>
              )}
              {customer.gender && (
                <div>
                  <span className="font-medium">Género:</span>{" "}
                  {customer.gender === "male"
                    ? "Masculino"
                    : customer.gender === "female"
                    ? "Femenino"
                    : "Otro"}
                </div>
              )}
              {customer.age && (
                <div>
                  <span className="font-medium">Edad:</span> {customer.age} años
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Historial de transacciones */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Transacciones</CardTitle>
            <CardDescription>
              {customerTransactions.length > 0
                ? `${customerTransactions.length} transacciones encontradas`
                : "No hay transacciones para este cliente"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customerTransactions.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {customerTransactions
                    .sort(
                      (a, b) =>
                        new Date(b.transaction_date).getTime() -
                        new Date(a.transaction_date).getTime()
                    )
                    .map((transaction) => (
                      <Card key={transaction.id}>
                        <CardHeader className="p-4">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              {transaction.description || "Sin descripción"}
                            </CardTitle>
                            <Badge
                              variant={
                                transaction.status === "completed"
                                  ? "success"
                                  : transaction.status === "pending"
                                  ? "outline"
                                  : "destructive"
                              }
                            >
                              {transaction.status === "completed"
                                ? "Completada"
                                : transaction.status === "pending"
                                ? "Pendiente"
                                : "Cancelada"}
                            </Badge>
                          </div>
                          <CardDescription>
                            {TransactionsService.formatLocalDate(transaction.sale_date || transaction.transaction_date)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 py-2">
                          <div className="flex justify-between">
                            <div>
                              <span className="font-medium">
                                {transaction.type === "income" ? "Ingreso" : "Gasto"}
                              </span>
                              <div className="text-sm text-muted-foreground mt-1">
                                Categoría: {transaction.category ? getCategoryDisplayName(transaction.category) : "No especificada"}
                              </div>
                            </div>
                            <span
                              className={
                                transaction.type === "income"
                                  ? "text-green-600 font-medium"
                                  : "text-red-600 font-medium"
                              }
                            >
                              {transaction.type === "income" ? "+" : "-"}
                              {formatCurrency(Number(transaction.total_amount || transaction.amount || 0))}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Este cliente no tiene transacciones registradas.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFooter = () => (
    <div className="flex justify-between w-full">
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              cliente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CustomerEditSheet
        customerId={customerId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      >
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </CustomerEditSheet>
    </div>
  );

  // Agregar una función para mostrar nombres de categorías
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

  if (isDesktop) {
    return (
      <>
        {children}
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetContent side="left" className="w-full sm:max-w-md h-full flex flex-col">
            <SheetHeader>
              <SheetTitle>Detalles del Cliente</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              {renderContent()}
            </div>
            <SheetFooter className="sticky bottom-0 pt-4 pb-6 border-t mt-2 bg-background">
              {renderFooter()}
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <CustomerEditSheet
          customerId={customerId}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
          side="right"
        />
      </>
    );
  } else {
    return (
      <>
        {children}
        <Drawer open={isOpen} onOpenChange={handleOpenChange}>
          <DrawerContent className="flex flex-col max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Detalles del Cliente</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 flex-1 overflow-y-auto">
              {renderContent()}
            </div>
            <DrawerFooter className="sticky bottom-0 pt-2 pb-6 border-t mt-2 bg-background">
              {renderFooter()}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <CustomerEditSheet
          customerId={customerId}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      </>
    );
  }
} 