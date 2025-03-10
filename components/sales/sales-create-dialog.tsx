"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { useDb } from "@/providers/db-provider";
import { useEffect, useState, useRef } from "react";
import { SaleStatus } from "@/lib/services/sales.service";
import { Product } from "@/lib/services/products.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useModal } from "@/components/contexts/modal-context";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Trash2 } from "lucide-react";

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
  const [saleDescription, setSaleDescription] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
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

  const { setIsModalOpen } = useModal();

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

  const formRef = useRef<HTMLFormElement>(null);

  const [swipeState, setSwipeState] = useState<{
    productId: string | null;
    offset: number;
    startX: number;
    isDragging: boolean;
  }>({
    productId: null,
    offset: 0,
    startX: 0,
    isDragging: false,
  });

  // Manejar cambios en el estado open controlado externamente
  useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);

  // Propagar cambios en el estado open al controlador externo
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    setIsModalOpen(newOpen);
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
          setSaleDescription(sale.sale_description || "");
          setPaymentMethod(sale.payment_method || "cash");

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
    setSaleDescription("");
    setPaymentMethod("cash");
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setError(null);

    // Validar campos requeridos
    if (!selectedStore || !formData.customer_id || !formData.employee_id) {
      const errorMsg = "Por favor selecciona un cliente y empleado";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validar productos
    if (selectedProducts.length === 0) {
      const errorMsg = "Debes seleccionar al menos un producto";
      setError(errorMsg);
      toast.error(errorMsg);
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
      const errorMsg = `Los siguientes productos tienen cantidades inválidas: ${productsWithInvalidQuantity.map((p) => p.name).join(", ")}`;
      setError(errorMsg);
      toast.error(errorMsg);
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
      const errorMsg = `No hay suficiente stock para "${stockValidation.name}". Solo hay ${stockValidation.stock} unidades disponibles.`;
      setError(errorMsg);
      toast.error(errorMsg);
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
        sale_description: saleDescription,
        payment_method: paymentMethod,
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

  // Función para manejar la selección de producto desde el select en móvil
  const handleProductSelectFromDropdown = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    handleProductSelect(product);
  };

  // Funciones para swipe para eliminar
  const handleTouchStart = (
    e: React.TouchEvent | React.MouseEvent,
    productId: string
  ) => {
    setSwipeState({
      productId,
      startX: "touches" in e ? e.touches[0].clientX : e.clientX,
      offset: 0,
      isDragging: true,
    });
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!swipeState.isDragging) return;

    const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const diff = currentX - swipeState.startX;

    // Solo permitir deslizar hacia la izquierda
    const newOffset = diff < 0 ? diff : 0;

    setSwipeState((prev) => ({
      ...prev,
      offset: newOffset,
    }));
  };

  const handleTouchEnd = () => {
    if (!swipeState.isDragging) return;

    // Si se deslizó más de 100px, eliminar el producto
    if (swipeState.offset < -100 && swipeState.productId) {
      removeProduct(swipeState.productId);
    }

    // Reiniciar el estado
    setSwipeState({
      productId: null,
      offset: 0,
      startX: 0,
      isDragging: false,
    });
  };

  if (!mounted) return null;

  const FormContent = (
    <form
      ref={formRef}
      className="flex flex-col h-full max-h-[85vh] overflow-y-auto pb-0 lg:pb-16"
    >
      <div className="px-2 py-2 flex flex-col gap-4">
        <div className="flex flex-col-reverse gap-4">
          {/* Vista móvil (solo visible en móviles) */}
          <div className="md:hidden flex flex-col gap-4 px-2">
            <Card>
              <CardContent className="p-4">
                <Label
                  htmlFor="mobile-product-select"
                  className="font-semibold block mb-2"
                >
                  Agregar producto
                </Label>
                <Select
                  onValueChange={handleProductSelectFromDropdown}
                  value=""
                >
                  <SelectTrigger id="mobile-product-select">
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {products
                        .filter(
                          (p) => !selectedProducts.some((sp) => sp.id === p.id)
                        )
                        .map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ${product.price.toFixed(2)} -
                            Stock: {product.stock}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Lista de productos seleccionados en vista móvil */}
            <Card className="max-h-[300px] min-h-[300px] overflow-y-scroll">
              <CardHeader className="px-4 py-2">
                <CardTitle className="text-base">
                  <div className="grid grid-cols-4 border-b pb-2">
                    <span className="col-span-2">Producto</span>
                    <span className="col-span-1 text-end">Cantidad</span>
                    <span className="col-span-1 text-end">Subtotal</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {selectedProducts.length === 0 ? (
                  <div className="flex justify-center items-center py-8">
                    <p className="text-sm text-muted-foreground italic">
                      No hay productos seleccionados
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {selectedProducts.map((product) => {
                      const quantity =
                        typeof product.quantity === "string"
                          ? parseInt(product.quantity) || 0
                          : product.quantity || 0;
                      const subtotal = product.price * quantity;
                      const isCurrentSwipe =
                        swipeState.productId === product.id;
                      const swipeOffset = isCurrentSwipe
                        ? swipeState.offset
                        : 0;
                      const deleteThreshold = swipeOffset < -50;

                      return (
                        <div
                          key={product.id}
                          className="relative overflow-hidden border-b last:border-b-0"
                        >
                          <div
                            className="absolute top-0 right-0 bottom-0 flex items-center justify-center bg-red-500 text-white px-4"
                            style={{
                              opacity: deleteThreshold
                                ? 1
                                : Math.min(Math.abs(swipeOffset) / 100, 0.7),
                              width: "80px",
                            }}
                          >
                            <Trash2 size={18} />
                          </div>
                          <div
                            className="relative bg-background items-center grid grid-cols-4 p-3 transition-transform"
                            style={{
                              transform: `translateX(${swipeOffset}px)`,
                            }}
                            onTouchStart={(e) =>
                              handleTouchStart(e, product.id)
                            }
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onMouseDown={(e) => handleTouchStart(e, product.id)}
                            onMouseMove={handleTouchMove}
                            onMouseUp={handleTouchEnd}
                            onMouseLeave={handleTouchEnd}
                          >
                            <div className="flex flex-col justify-center col-span-2 mb-1">
                              <h4 className="font-medium">{product.name}</h4>
                              <div className="flex text-xs text-muted-foreground mb-2">
                                <span>
                                  Stock: {product.stock} | Precio: $
                                  {product.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-end col-span-1">
                              <Input
                                type="number"
                                value={product.quantity.toString()}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    product.id,
                                    e.target.value
                                  )
                                }
                                min="1"
                                className="w-16 text-center"
                              />
                            </div>
                            <span className="font-semibold flex justify-end col-span-1">
                              ${subtotal.toFixed(2)}
                            </span>
                            {showStockWarning?.productId === product.id && (
                              <p className="text-xs text-red-500 mt-1">
                                {showStockWarning.warning}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Vista desktop (oculta en móviles) */}
          <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-2 px-2">
            {/* Mostrar todos los productos en forma de tarjetas */}
            <div className="lg:col-span-1">
              <Card>
                <Label className="font-semibold border-b px-4 py-5 block">
                  Productos disponibles
                </Label>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] min-h-[300px] overflow-y-scroll p-2 bg-background">
                  {products.map((product) => {
                    const isSelected = selectedProducts.some(
                      (p) => p.id === product.id
                    );
                    return (
                      <div
                        key={product.id}
                        className={`cursor-pointer transition-all hover:scale-[1.02] ${
                          isSelected ? "border-2 border-primary shadow-md" : ""
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedProducts(
                              selectedProducts.filter(
                                (p) => p.id !== product.id
                              )
                            );
                          } else {
                            handleProductSelect(product);
                          }
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Precio: ${product.price.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Stock: {product.stock}
                            </p>
                          </div>
                        </CardContent>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Productos Seleccionados */}
            <div className="col-span-2">
              <Card>
                <Label className="hidden">Productos seleccionados</Label>
                <div className="grid grid-cols-12 text-sm font-semibold border-b p-4">
                  <div className="col-span-5">Producto</div>
                  <div className="col-span-2 text-center">Precio</div>
                  <div className="col-span-2 text-center">Cantidad</div>
                  <div className="col-span-2 text-center">Subtotal</div>
                  <div className="col-span-1"></div>
                </div>
                <CardContent className="p-0 pl-4">
                  <div
                    className={`max-h-[300px] min-h-[300px] overflow-y-scroll ${selectedProducts.length === 0 ? "flex justify-center items-center" : ""}`}
                  >
                    {selectedProducts.length === 0 ? (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-sm text-muted-foreground italic">
                          No hay productos seleccionados
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {selectedProducts.map((product) => {
                          const quantity =
                            typeof product.quantity === "string"
                              ? parseInt(product.quantity) || 0
                              : product.quantity || 0;
                          const subtotal = product.price * quantity;

                          return (
                            <div
                              key={product.id}
                              className="grid grid-cols-12 items-center py-2 border-b"
                            >
                              <div className="col-span-5 font-medium">
                                {product.name}
                              </div>
                              <div className="col-span-2 text-center">
                                ${product.price.toFixed(2)}
                              </div>
                              <div className="col-span-2 text-center">
                                <Input
                                  type="number"
                                  value={product.quantity.toString()}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      product.id,
                                      e.target.value
                                    )
                                  }
                                  min="1"
                                  className="w-16 mx-auto text-center"
                                />
                                {showStockWarning?.productId === product.id && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {showStockWarning.warning}
                                  </p>
                                )}
                              </div>
                              <div className="col-span-2 text-center font-medium">
                                ${subtotal.toFixed(2)}
                              </div>
                              <div className="col-span-1 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => removeProduct(product.id)}
                                  className="h-7 w-7 p-0"
                                  title="Eliminar producto"
                                >
                                  ✕
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Cliente, Empleado y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 px-2 gap-4">
            <div className="lg:w-full">
              <Label htmlFor="customer">Cliente</Label>
              <Select
                value={formData.customer_id || "Selecciona un cliente"}
                onValueChange={(value) => {
                  setFormData({ ...formData, customer_id: value });
                  const customer = customers.find((c) => c.id === value);
                  if (customer) setCustomerDisplayName(customer.name);
                }}
              >
                <SelectTrigger id="customer">
                  <SelectValue>
                    {formData.customer_id
                      ? customerDisplayName
                      : "Selecciona un cliente"}
                  </SelectValue>
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

            <div className="lg:w-full">
              <Label htmlFor="employee">Empleado</Label>
              <Select
                value={formData.employee_id || "Selecciona un empleado"}
                onValueChange={(value) => {
                  setFormData({ ...formData, employee_id: value });
                  const employee = employees.find((e) => e.id === value);
                  if (employee) setEmployeeDisplayName(employee.name);
                }}
              >
                <SelectTrigger id="employee">
                  <SelectValue>
                    {formData.employee_id
                      ? employeeDisplayName
                      : "Selecciona un empleado"}
                  </SelectValue>
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

            {/* Método de pago */}
            <div className="lg:w-full">
              <Label htmlFor="payment_method">Método de pago</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value: string) => setPaymentMethod(value)}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Seleccione método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="credit_card">
                    Tarjeta de crédito
                  </SelectItem>
                  <SelectItem value="others">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="grid px-2 gap-1.5">
          <Label htmlFor="message">Descripción</Label>
          <Textarea
            placeholder="Escriba una descripción para esta venta"
            id="message"
            name="sale_description"
            value={saleDescription}
            onChange={(e) => setSaleDescription(e.target.value)}
          />
        </div>
      </div>
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

  // Componente responsivo - Desktop usa Sheet, Mobile/Tablet usa Drawer
  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        {!isEditMode && (
          <SheetTrigger asChild>
            <Button size="sm" className="">
              Nueva Venta
            </Button>
          </SheetTrigger>
        )}
        <SheetContent className="sm:max-w-3xl p-0">
          <Toaster position="top-right" />
          <SheetHeader className="sticky top-0 left-0 right-0 bg-background px-6 h-20 border-b flex justify-center z-10">
            <SheetTitle className="text-xl">
              {`Registrar nueva Venta de ${selectedStore?.name}`}
            </SheetTitle>
            <SheetDescription>
              {isEditMode
                ? "Modifica la información de la venta"
                : "Completa el formulario para registrar una nueva venta"}
            </SheetDescription>
          </SheetHeader>
          {loadingInitialData ? LoadingContent : FormContent}
          {/* Footer */}
          <div className="h-16 bg-background flex flex-row justify-between items-center px-6 py-4 border-t sticky bottom-0 right-0">
            {/* Total */}
            <div className="">
              <Badge className="bg-background text-primary text-lg py-2 px-3 hover:bg-background hover:text-primary">
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
              <Button type="button" disabled={loading} onClick={handleSubmit}>
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
          </div>
        </SheetContent>
      </Sheet>
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
          <Toaster position="top-right" />
          <DrawerHeader>
            <DrawerTitle className="text-xl">
              Registrar nueva Venta de {selectedStore?.name}
            </DrawerTitle>
          </DrawerHeader>

          {loadingInitialData ? LoadingContent : FormContent}

          {/* Footer para versión móvil */}
          <DrawerFooter className="border-t sticky bottom-0 right-0">
            <div className="flex justify-between items-center">
              {/* Total */}
              <div>
                <Badge className="bg-background text-primary text-lg py-2 px-3 hover:bg-background hover:text-primary">
                  Total: ${totalAmount.toFixed(2)}
                </Badge>
              </div>
              <Button type="button" disabled={loading} onClick={handleSubmit}>
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
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
}
