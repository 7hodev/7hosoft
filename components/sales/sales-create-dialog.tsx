"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDb } from "@/providers/db-provider";
import { useEffect, useState } from "react";
import { SaleStatus } from "@/lib/services/sales.service";
import { Product } from "@/lib/services/products.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface SalesCreateDialogProps {
  // Si editSaleId tiene valor, estamos en modo edición
  editSaleId?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SalesCreateDialog({
  editSaleId,
  isOpen,
  onOpenChange,
}: SalesCreateDialogProps) {
  const {
    selectedStore,
    customers,
    employees,
    products,
    sales,
    createSale,
    updateSale,
    refreshData,
    getSaleProducts,
  } = useDb();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    employee_id: "",
  });
  const [selectedStatus, setSelectedStatus] = useState<SaleStatus>("pending");
  const [selectedProducts, setSelectedProducts] = useState<
    Array<Product & { quantity: number | string }>
  >([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStockWarning, setShowStockWarning] = useState<{
    productId: string;
    warning: string;
  } | null>(null);

  // Nombres para mostrar en selects
  const [customerDisplayName, setCustomerDisplayName] = useState(
    "Selecciona un cliente"
  );
  const [employeeDisplayName, setEmployeeDisplayName] = useState(
    "Selecciona un empleado"
  );

  // Determinar si estamos en modo edición
  const isEditMode = Boolean(editSaleId);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Manejar cambios en el estado open controlado externamente
  useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);

  // Propagar cambios en el estado open al controlador externo
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  // Cargar datos de la venta en modo edición
  useEffect(() => {
    const loadSaleData = async () => {
      if (editSaleId && open) {
        setLoadingInitialData(true);
        try {
          // Buscar la venta por ID
          const sale = sales.find((sale) => sale.id === editSaleId);
          if (!sale) {
            toast.error("No se encontró la venta para editar");
            return;
          }

          // Establecer datos básicos
          setFormData({
            customer_id: sale.customer_id,
            employee_id: sale.employee_id,
          });

          setSelectedStatus(sale.status as SaleStatus);

          // Actualizar nombres para mostrar
          const customer = customers.find((c) => c.id === sale.customer_id);
          if (customer) setCustomerDisplayName(customer.name);

          const employee = employees.find((e) => e.id === sale.employee_id);
          if (employee) setEmployeeDisplayName(employee.name);

          // Cargar productos de la venta
          const saleProducts = await getSaleProducts(editSaleId);

          // Convertir a formato para el formulario
          const formattedProducts = saleProducts.map(
            ({ product, soldProduct }) => ({
              ...product,
              quantity: soldProduct.quantity,
            })
          );

          setSelectedProducts(formattedProducts);
        } catch (error) {
          console.error("Error al cargar datos de la venta:", error);
          toast.error("Error al cargar la información de la venta");
        } finally {
          setLoadingInitialData(false);
        }
      } else {
        // Resetear el formulario cuando se abre para una nueva venta
        if (open && !editSaleId) {
          resetForm();
        }
      }
    };

    loadSaleData();
  }, [editSaleId, open, sales, customers, employees, getSaleProducts]);

  // Actualizar nombres cuando cambian las selecciones
  useEffect(() => {
    if (formData.customer_id) {
      const customer = customers.find((c) => c.id === formData.customer_id);
      if (customer) {
        setCustomerDisplayName(customer.name);
      }
    } else {
      setCustomerDisplayName("Selecciona un cliente");
    }
  }, [formData.customer_id, customers]);

  useEffect(() => {
    if (formData.employee_id) {
      const employee = employees.find((e) => e.id === formData.employee_id);
      if (employee) {
        setEmployeeDisplayName(employee.name);
      }
    } else {
      setEmployeeDisplayName("Selecciona un empleado");
    }
  }, [formData.employee_id, employees]);

  // Obtener el texto del estado seleccionado
  const getStatusText = () => {
    const statusMap = {
      pending: "Pendiente",
      completed: "Completada",
      canceled: "Cancelada",
    };
    return statusMap[selectedStatus] || "Selecciona un estado";
  };

  // Funciones para manejar productos
  const handleProductSelect = (product: Product) => {
    // Evitar duplicados
    if (selectedProducts.some((p) => p.id === product.id)) {
      return;
    }

    setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const numValue = value === "" ? "" : parseInt(value);

    // Actualizar la cantidad del producto
    setSelectedProducts((prevProducts) => {
      return prevProducts.map((product) => {
        if (product.id === productId) {
          // Verificar si hay suficiente stock
          if (typeof numValue === "number" && numValue > product.stock) {
            setShowStockWarning({
              productId,
              warning: `Solo hay ${product.stock} unidades disponibles`,
            });
          } else {
            setShowStockWarning(null);
          }

          return { ...product, quantity: numValue };
        }
        return product;
      }) as (Product & { quantity: string | number })[];
    });
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
    if (showStockWarning?.productId === productId) {
      setShowStockWarning(null);
    }
  };

  // Resetear el formulario a valores predeterminados
  const resetForm = () => {
    setFormData({ customer_id: "", employee_id: "" });
    setSelectedProducts([]);
    setSelectedStatus("pending");
    setCustomerDisplayName("Selecciona un cliente");
    setEmployeeDisplayName("Selecciona un empleado");
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const totalAmount = selectedProducts.reduce((acc, product) => {
    const quantity =
      typeof product.quantity === "string"
        ? product.quantity === ""
          ? 0
          : parseInt(product.quantity)
        : product.quantity;
    return acc + product.price * (quantity || 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar campos requeridos
    if (!selectedStore || !formData.customer_id || !formData.employee_id) {
      setError("Por favor selecciona un cliente y empleado");
      return;
    }

    // Validar productos
    if (selectedProducts.length === 0) {
      setError("Debes seleccionar al menos un producto");
      return;
    }

    // Validar cantidades
    const productsWithInvalidQuantity = selectedProducts.filter((p) => {
      if (typeof p.quantity === "string") {
        return !p.quantity || p.quantity === "";
      }
      return !p.quantity || p.quantity <= 0;
    });

    if (productsWithInvalidQuantity.length > 0) {
      setError(
        `Los siguientes productos tienen cantidades inválidas: ${productsWithInvalidQuantity.map((p) => p.name).join(", ")}`
      );
      return;
    }

    // Convertir cantidades a números para validación de stock
    const productsWithNumericQuantity = selectedProducts.map((p) => ({
      ...p,
      quantity:
        typeof p.quantity === "string" ? parseInt(p.quantity) || 0 : p.quantity,
    }));

    // Validar stock
    const stockValidation = productsWithNumericQuantity.find(
      (p) => p.quantity > p.stock
    );
    if (stockValidation) {
      setError(
        `No hay suficiente stock para "${stockValidation.name}". Solo hay ${stockValidation.stock} unidades disponibles.`
      );
      return;
    }

    setLoading(true);

    try {
      // Asegurarnos que solo enviamos estados válidos (pending/completed)
      // Si en el futuro la base de datos soporta 'canceled', solo elimina esta validación
      const validStatus: SaleStatus =
        selectedStatus === "canceled" ? "pending" : selectedStatus;

      // Los datos comunes para crear o actualizar
      const saleData = {
        store_id: selectedStore.id,
        customer_id: formData.customer_id,
        employee_id: formData.employee_id,
        sale_date: new Date().toISOString(),
        status: validStatus,
        total_amount: totalAmount,
        products: productsWithNumericQuantity.map((p) => ({
          id: p.id,
          quantity: p.quantity,
        })),
      };

      if (isEditMode && editSaleId) {
        // Actualizar venta existente
        await updateSale(editSaleId, saleData);
        toast.success("Venta actualizada correctamente");
      } else {
        // Crear nueva venta
        await createSale(saleData);
        toast.success("Venta creada correctamente");
      }

      // Resetear formulario
      resetForm();
      handleOpenChange(false);
      refreshData();
    } catch (err) {
      console.error("Error en SalesCreateDialog:", err);
      let errorMessage = isEditMode
        ? "Error al actualizar la venta"
        : "Error al crear la venta";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const FormContent = (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="px-6 py-2">
        <div className="flex flex-col-reverse lg:flex-row-reverse gap-4">
          {/* Productos */}
          <div className="w-full lg:w-1/2 flex flex-col gap-2 px-2">
            {/* Selector de Productos */}
            <div className="">
              <Label htmlFor="selectProduct" className="hidden">
                Añadir producto
              </Label>
              <Select
                onValueChange={(value) => {
                  const selectedProduct = products.find((p) => p.id === value);
                  if (selectedProduct) {
                    handleProductSelect(selectedProduct);
                  }
                }}
              >
                <SelectTrigger id="selectProduct">
                  <SelectValue placeholder="Selecciona un producto">
                    Selecciona un producto
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {products
                    .filter(
                      (product) =>
                        !selectedProducts.some((p) => p.id === product.id)
                    )
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - ${product.price.toFixed(2)} - Stock:{" "}
                        {product.stock}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Productos Seleccionados */}
            <div
              className={`${selectedProducts.length === 0 ? "flex justify-center items-center" : ""} bg-accent p-2 rounded-md border-2 border-dashed max-h-[237px] min-h-[237px] overflow-y-auto`}
            >
              <Label className="hidden">Productos seleccionados</Label>
              {selectedProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No hay productos seleccionados
                </p>
              ) : (
                <div className="space-y-2 max-h-[300px] pr-1">
                  {selectedProducts.map((product) => (
                    <Card key={product.id} className="relative">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Precio: ${product.price.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Stock: {product.stock}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="w-20">
                            <Input
                              type="number"
                              value={product.quantity.toString()}
                              onChange={(e) =>
                                handleQuantityChange(product.id, e.target.value)
                              }
                              min="1"
                              className="w-full"
                            />
                            {showStockWarning?.productId === product.id && (
                              <p className="text-xs text-red-500 mt-1">
                                {showStockWarning.warning}
                              </p>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeProduct(product.id)}
                            className="h-10 w-10 p-0"
                          >
                            ✕
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cliente, Empleado y Estado */}
          <div className="w-full lg:w-1/2 flex flex-col lg:flex-col px-2 gap-4">
            <div className="">
              <Label htmlFor="customer">Cliente</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, customer_id: value })
                }
              >
                <SelectTrigger id="customer">
                  <SelectValue placeholder={customerDisplayName} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="">
              <Label htmlFor="employee">Empleado</Label>
              <Select
                value={formData.employee_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, employee_id: value })
                }
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder={employeeDisplayName} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado de la venta */}
            <div className="lg:w-full">
              <Label htmlFor="status">Estado de la venta</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value: SaleStatus) => setSelectedStatus(value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder={getStatusText()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="canceled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="flex flex-row justify-between px-6 py-4 border-t">
        {/* Total */}
        <div className="">
          <Badge variant="outline" className="text-lg py-2 px-3">
            Total: ${totalAmount.toFixed(2)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
            className="hidden lg:block"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="flex items-center space-x-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Guardando...</span>
              </div>
            ) : (
              "Crear venta"
            )}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );

  const LoadingContent = (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center space-x-2">
        <svg
          className="animate-spin h-5 w-5 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>Cargando información de la venta...</span>
      </div>
    </div>
  );

  // Componente responsivo - Desktop usa Dialog, Mobile/Tablet usa Drawer
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {!isEditMode && (
          <DialogTrigger asChild>
            <Button size="sm" className="">
              Nueva Venta
            </Button>
          </DialogTrigger>
        )}

        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-y-auto">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl">
              {isEditMode
                ? `Editar Venta #${editSaleId && typeof editSaleId === "string" ? editSaleId.slice(-4) : ""}`
                : `Registrar nueva Venta de ${selectedStore?.name}`}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Modifica la información de la venta"
                : "Completa el formulario para registrar una nueva venta"}
            </DialogDescription>
          </DialogHeader>

          {loadingInitialData ? LoadingContent : FormContent}
        </DialogContent>
      </Dialog>
    );
  } else {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        {!isEditMode && (
          <Button size="sm" className="" onClick={() => handleOpenChange(true)}>
            Nueva Venta
          </Button>
        )}

        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="text-xl">
              {isEditMode
                ? `Editar Venta #${editSaleId && typeof editSaleId === "string" ? editSaleId.slice(-4) : ""}`
                : `Registrar nueva Venta de ${selectedStore?.name}`}
            </DrawerTitle>
          </DrawerHeader>

          {loadingInitialData ? LoadingContent : FormContent}
        </DrawerContent>
      </Drawer>
    );
  }
}
