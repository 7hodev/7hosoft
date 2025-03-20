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
import { useEffect, useState, useRef, useMemo } from "react";
import { TransactionStatus, TransactionType, TransactionCategory } from "@/lib/services/transactions.service";
import { Product } from "@/lib/services/products.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
import { Trash2, ShoppingCart, CreditCard, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerCreateSheet } from "@/components/customer/customer-create-sheet";

// Definir un tipo para los productos seleccionados
type SelectedProduct = Product & { quantity: number | string };

interface TransactionsCreateSheetProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TransactionsCreateSheet({
  isOpen,
  onOpenChange,
}: TransactionsCreateSheetProps) {
  const {
    selectedStore,
    customers,
    employees,
    products,
    createTransaction,
    refreshData,
  } = useDb();

  // Use controlled state if isOpen is provided, otherwise internal state
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  
  const handleOpenChange = (value: boolean) => {
    setInternalOpen(value);
    if (onOpenChange) {
      onOpenChange(value);
    }
  };

  // Estados principales
  const [formData, setFormData] = useState({
    customer_id: "",
    employee_id: "",
    recipient: "",
  });
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus>("completed");
  const [transactionDescription, setTransactionDescription] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [transactionType, setTransactionType] = useState<TransactionType>("income");
  const [transactionCategory, setTransactionCategory] = useState<TransactionCategory>("sales");
  const [transactionDate, setTransactionDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [isDeductible, setIsDeductible] = useState<boolean>(false);
  const [expenseAmount, setExpenseAmount] = useState<string>("0");
  const [recipientType, setRecipientType] = useState<"other" | "employee">("other");

  // Estados auxiliares
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStockWarning, setShowStockWarning] = useState<{
    productId: string;
    warning: string;
  } | null>(null);
  const [customerDisplayName, setCustomerDisplayName] = useState("Selecciona un cliente");
  const [employeeDisplayName, setEmployeeDisplayName] = useState("Selecciona un empleado");

  // Referencias y utilidades
  const { setIsModalOpen } = useModal();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const formRef = useRef<HTMLFormElement>(null);

  // Estado para manejar el gesto de deslizar para eliminar en móvil
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

  // Estados calculados
  const totalAmount = useMemo(() => {
    return selectedProducts.reduce((sum, item) => {
      const quantity =
        typeof item.quantity === "string"
          ? parseInt(item.quantity) || 0
          : item.quantity;
      return sum + item.price * quantity;
    }, 0);
  }, [selectedProducts]);

  // Efectos
  useEffect(() => {
    setMounted(true);

    if (isOpen !== undefined) {
      setInternalOpen(isOpen);
    }

    if (open) {
      setIsModalOpen(true);
      resetForm();
    } else {
      setIsModalOpen(false);
    }

    return () => {
      setIsModalOpen(false);
    };
  }, [isOpen, open, setIsModalOpen]);

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

  // Funciones auxiliares
  const getStatusText = () => {
    switch (selectedStatus) {
      case "completed":
        return "Completada";
      case "canceled":
        return "Cancelada";
      case "refunded":
        return "Reembolsada";
      case "pending":
      default:
        return "Pendiente";
    }
  };

  const handleProductSelect = (product: Product) => {
    if (!selectedProducts.some((p) => p.id === product.id)) {
      setSelectedProducts(prevProducts => [...prevProducts, { ...product, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (productId: string, value: string) => {
    // Validar que sea un número positivo
    const numericValue = value === "" ? "" : value.replace(/[^0-9]/g, "");
    
    // Si es 0 o campo vacío, mostrar
    if (numericValue === "" || numericValue === "0") {
      setSelectedProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === productId ? { ...p, quantity: numericValue } : p
        ) as SelectedProduct[]
      );
      return;
    }

    // Convertir a número para comparar con stock
    const quantity = parseInt(numericValue);
    const product = products.find((p) => p.id === productId);
    
    if (product && quantity > product.stock) {
      setShowStockWarning({
        productId,
        warning: `Excede stock disponible (${product.stock})`,
      });
    } else {
      if (showStockWarning?.productId === productId) {
        setShowStockWarning(null);
      }
    }

    setSelectedProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === productId ? { ...p, quantity: numericValue } : p
      ) as SelectedProduct[]
    );
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    if (showStockWarning?.productId === productId) {
      setShowStockWarning(null);
    }
  };

  const handleProductSelectFromDropdown = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      handleProductSelect(product);
    }
  };

  const resetForm = () => {
    setSelectedProducts([]);
    setTransactionType("income");
    setTransactionCategory("sales");
    setSelectedStatus("completed");
    setTransactionDescription("");
    setPaymentMethod("cash");
    setIsDeductible(false);
    setExpenseAmount("0");
    setFormData({
      customer_id: "",
      employee_id: "",
      recipient: "",
    });
    setTransactionDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setError(null);
    setShowStockWarning(null);
  };

  const resetFormExceptType = (type: TransactionType) => {
    setFormData({
      customer_id: "",
      employee_id: "",
      recipient: "",
    });
    setSelectedStatus("completed");
    setTransactionDescription("");
    setPaymentMethod("cash");
    setSelectedProducts([]);
    setShowStockWarning(null);
    setError(null);
    
    // Establecer categoría predeterminada para cada tipo
    if (type === "income") {
      setTransactionCategory("sales");
    } else {
      setTransactionCategory("cost_of_goods_sold");
    }
    
    setTransactionDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setIsDeductible(false);
    setExpenseAmount("0");
  };

  // Funciones para deslizar para eliminar en móvil
  const handleTouchStart = (
    e: React.TouchEvent | React.MouseEvent,
    productId: string
  ) => {
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    setSwipeState({
      productId,
      startX: clientX,
      offset: 0,
      isDragging: true,
    });
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!swipeState.isDragging) return;

    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const diff = clientX - swipeState.startX;
    
    // Solo permitir deslizar hacia la izquierda (eliminar)
    const offset = diff < 0 ? diff : 0;
    
    setSwipeState((prev) => ({
      ...prev,
      offset: offset,
    }));
  };

  const handleTouchEnd = () => {
    const THRESHOLD = -80; // Umbral para eliminar

    if (swipeState.offset < THRESHOLD && swipeState.productId) {
      removeProduct(swipeState.productId);
    }

    setSwipeState({
      productId: null,
      startX: 0,
      offset: 0,
      isDragging: false,
    });
  };

  // Antes de handleSubmit, añadir esta función para actualizar los campos del formulario
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para calcular el total de los productos seleccionados
  const calculateTotal = (): number => {
    return selectedProducts.reduce(
      (total, product) => total + (Number(product.price) || 0) * (Number(product.quantity) || 0),
      0
    );
  };

  // Validar y enviar formulario
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!validateFormData()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("CREANDO TRANSACCIÓN:", transactionType, transactionCategory);
      
      // Inicializamos datos básicos
      const transactionData: any = {
        type: transactionType,
        category: transactionCategory,
        status: 'completed',
        payment_method: paymentMethod,
        // Usar la fecha local tal como se capturó en el formulario
        sale_date: transactionDate,
        description: transactionDescription || null,
        store_id: selectedStore.id,
      };

      // Validación básica
      if (!selectedStore?.id) {
        console.error("No store selected");
        toast.error("Error: No se ha seleccionado ninguna tienda");
        return;
      }
      
      if (transactionType === 'income' && !formData.customer_id) {
        toast.error("Selecciona un cliente para la transacción");
        return;
      }
      
      if (!transactionDate) {
        toast.error("Selecciona una fecha para la transacción");
        return;
      }
      
      if (transactionType === 'expense' && !formData.recipient && recipientType !== 'employee') {
        toast.error("Ingresa un destinatario para el gasto");
        return;
      }
      
      const finalAmount = transactionType === 'income' 
        ? (transactionCategory === 'sales' ? calculateTotal() : parseFloat(expenseAmount) || 0) 
        : parseFloat(expenseAmount) || 0;
      
      if (isNaN(finalAmount) || finalAmount <= 0) {
        toast.error("El monto debe ser mayor a 0");
        return;
      }
      
      // Para gastos, asegurar que recipient esté definido
      let recipientValue = formData.recipient;
      
      if (transactionType === 'expense') {
        if (recipientType === 'employee' && formData.employee_id) {
          const employee = employees.find(e => e.id === formData.employee_id);
          recipientValue = employee?.name || "Empleado";
        } else if (!recipientValue) {
          recipientValue = "Sin destinatario";
        }
      }

      // Construir datos de la transacción
      transactionData.customer_id = formData.customer_id || '';
      transactionData.employee_id = formData.employee_id || '';
      transactionData.recipient = recipientValue;
      transactionData.total_amount = finalAmount;
      transactionData.products = selectedProducts.map(p => ({
        id: p.id,
        quantity: p.quantity
      }));

      // Crear la transacción
      const result = await createTransaction(transactionData);
      console.log("✅ TRANSACCIÓN CREADA:", result);
      
      // Notificamos y cerramos
      toast.success(`${transactionType === 'income' ? 'Ingreso' : 'Gasto'} registrado correctamente`);

      // Esperar un momento antes de refrescar los datos para asegurar
      // que la base de datos haya procesado completamente la transacción
      setTimeout(() => {
        refreshData(); // Actualizar datos para mostrar la nueva transacción
      }, 500);

      resetForm();
      handleOpenChange(false);
      
    } catch (err) {
      console.error("❌ ERROR CREANDO TRANSACCIÓN:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al crear la transacción";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función de validación
  const validateFormData = () => {
    // Validaciones específicas según el tipo de transacción
    if (transactionType === 'income') {
      // Validar campos requeridos para ingresos
      if (!selectedStore || !formData.customer_id || !formData.employee_id) {
        const errorMsg = "Por favor selecciona un cliente y empleado";
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }

      // Validar productos solo si la categoría es "sales"
      if (transactionCategory === 'sales') {
        if (selectedProducts.length === 0) {
          const errorMsg = "Debes seleccionar al menos un producto";
          setError(errorMsg);
          toast.error(errorMsg);
          return false;
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
          return false;
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
          return false;
        }
      } else {
        // Para otras categorías, validar que haya un monto
        if (parseFloat(expenseAmount) <= 0) {
          const errorMsg = "Por favor ingresa un monto mayor a cero";
          setError(errorMsg);
          toast.error(errorMsg);
          return false;
        }
      }
    } else { // Validaciones para gastos
      // Validar campos requeridos para gastos
      if (!selectedStore || !formData.recipient || !expenseAmount) {
        const errorMsg = "Por favor ingresa el destinatario del gasto y el monto";
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    }

    return true;
  };

  if (!mounted) return null;

  // Componentes de UI para productos en versión móvil
  const MobileProductView = () => (
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
                const isCurrentSwipe = swipeState.productId === product.id;
                const swipeOffset = isCurrentSwipe ? swipeState.offset : 0;
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
                      onTouchStart={(e) => handleTouchStart(e, product.id)}
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
                            handleQuantityChange(product.id, e.target.value)
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
  );

  // Componentes de UI para productos en versión desktop
  const DesktopProductView = () => (
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
                        selectedProducts.filter((p) => p.id !== product.id)
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
              className={`max-h-[300px] min-h-[300px] overflow-y-scroll ${
                selectedProducts.length === 0 ? "flex justify-center items-center" : ""
              }`}
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
                              handleQuantityChange(product.id, e.target.value)
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
  );

  // Componente de formulario de ingresos
  const IncomeFormContent = (
    <form
      ref={formRef}
      className="flex flex-col h-full max-h-[85vh] overflow-y-auto pb-0 lg:pb-14"
    >
      <div className="px-2 py-2 flex flex-col gap-4">
        <div className="flex flex-col-reverse gap-4">
          {/* Vista móvil y desktop para productos - solo mostrar si la categoría es "sales" */}
          {transactionType === 'income' && transactionCategory === 'sales' && (
            <>
              <MobileProductView />
              <DesktopProductView />
            </>
          )}
          
          {/* Cliente, Empleado, Estado y Método de pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 px-2 gap-4">
            <div className="space-y-2 mb-4">
              <Label htmlFor="transaction-date">Fecha y hora</Label>
              <div className="flex gap-2">
                <Input
                  id="transaction-date"
                  type="datetime-local"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="lg:w-full">
              <Label htmlFor="transaction_category">Categoría</Label>
              <Select
                value={transactionCategory}
                onValueChange={(value: TransactionCategory) => setTransactionCategory(value)}
              >
                <SelectTrigger id="transaction_category">
                  <SelectValue placeholder="Seleccione categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Ventas</SelectItem>
                  <SelectItem value="services">Servicios</SelectItem>
                  <SelectItem value="investment_returns">Retornos de inversión</SelectItem>
                  <SelectItem value="interest_income">Ingresos por intereses</SelectItem>
                  <SelectItem value="rental_income">Ingresos por alquiler</SelectItem>
                  <SelectItem value="refunds_received">Reembolsos recibidos</SelectItem>
                  <SelectItem value="other_income">Otros ingresos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="customer">Cliente</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
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
                <CustomerCreateSheet
                  onSuccess={() => refreshData()}
                >
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10"
                    title="Crear nuevo cliente"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CustomerCreateSheet>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="employee">Empleado</Label>
              <Select
                value={formData.employee_id}
                onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
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

            {/* Estado de la transacción */}
            <div className="lg:w-full">
              <Label htmlFor="status">Estado de la transacción</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value: TransactionStatus) => setSelectedStatus(value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder={getStatusText()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="canceled">Cancelada</SelectItem>
                  <SelectItem value="refunded">Reembolsada</SelectItem>
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
                  <SelectItem value="credit_card">Tarjeta de crédito</SelectItem>
                  <SelectItem value="debit_card">Tarjeta de débito</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="others">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Mostrar campo para monto total si la categoría no es "sales" */}
            {transactionCategory !== 'sales' && (
              <div className="lg:w-full">
                <Label htmlFor="income-amount">Monto total</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="income-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid px-2 gap-1.5">
          <Label htmlFor="message">Descripción</Label>
          <Textarea
            placeholder="Escriba una descripción para esta transacción"
            id="message"
            name="transaction_description"
            value={transactionDescription}
            onChange={(e) => setTransactionDescription(e.target.value)}
          />
        </div>
      </div>
    </form>
  );

  // Componente de formulario de gastos
  const ExpenseFormContent = (
    <form
      className="flex flex-col h-full max-h-[85vh] overflow-y-auto pb-0 lg:pb-14"
    >
      <div className="px-2 py-2 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 px-2 gap-4">
          <div className="space-y-2 mb-4">
            <Label htmlFor="transaction-date">Fecha y hora</Label>
            <div className="flex gap-2">
              <Input
                id="transaction-date"
                type="datetime-local"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <Label htmlFor="recipient">Destinatario</Label>
            <Input
              id="recipient"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              placeholder="Nombre del destinatario"
            />
          </div>
          
          <div className="lg:w-full">
            <Label htmlFor="expense_category">Categoría</Label>
            <Select
              value={transactionCategory}
              onValueChange={(value: TransactionCategory) => setTransactionCategory(value)}
            >
              <SelectTrigger id="expense_category">
                <SelectValue placeholder="Seleccione categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cost_of_goods_sold">Costo de productos vendidos</SelectItem>
                <SelectItem value="salaries_wages">Salarios y sueldos</SelectItem>
                <SelectItem value="rent">Alquiler</SelectItem>
                <SelectItem value="utilities">Servicios públicos</SelectItem>
                <SelectItem value="office_supplies">Suministros de oficina</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="travel">Viajes</SelectItem>
                <SelectItem value="insurance">Seguros</SelectItem>
                <SelectItem value="professional_services">Servicios profesionales</SelectItem>
                <SelectItem value="equipment">Equipamiento</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="taxes">Impuestos</SelectItem>
                <SelectItem value="refunds_issued">Reembolsos emitidos</SelectItem>
                <SelectItem value="other_expenses">Otros gastos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="lg:w-full">
            <Label htmlFor="expense_payment_method">Método de pago</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value: string) => setPaymentMethod(value)}
            >
              <SelectTrigger id="expense_payment_method">
                <SelectValue placeholder="Seleccione método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="credit_card">Tarjeta de crédito</SelectItem>
                <SelectItem value="debit_card">Tarjeta de débito</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="others">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="lg:w-full">
            <Label htmlFor="expense_status">Estado</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value: TransactionStatus) => setSelectedStatus(value)}
            >
              <SelectTrigger id="expense_status">
                <SelectValue placeholder={getStatusText()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 mb-4">
            <Label htmlFor="expense-amount">Monto total</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                $
              </span>
              <Input
                id="expense-amount"
                type="number"
                min="0"
                step="0.01"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          
          <div className="lg:w-full flex items-center space-x-2 pt-6">
            <Checkbox 
              id="deductible" 
              checked={isDeductible}
              onCheckedChange={(checked) => setIsDeductible(checked as boolean)}
            />
            <Label htmlFor="deductible" className="cursor-pointer">Deducible de impuestos</Label>
          </div>
        </div>
        
        <div className="grid px-2 gap-1.5">
          <Label htmlFor="expense_description">Descripción</Label>
          <Textarea
            placeholder="Escriba una descripción para este gasto"
            id="expense_description"
            value={transactionDescription}
            onChange={(e) => setTransactionDescription(e.target.value)}
          />
        </div>
      </div>
    </form>
  );

  // Botones para cambiar entre formulario de ingreso y gasto
  const TypeSwitcherButtons = () => (
    <div className="flex mb-4 border rounded-lg p-1 w-fit mx-auto">
      <Button
        type="button"
        onClick={() => {
          if (transactionType !== "income") {
            setTransactionType("income");
            resetFormExceptType("income");
          }
        }}
        variant={transactionType === "income" ? "default" : "outline"}
        size="sm"
        className="flex items-center gap-2 px-4"
      >
        <ShoppingCart size={16} />
        <span>Ingreso</span>
      </Button>
      <Button
        type="button"
        onClick={() => {
          if (transactionType !== "expense") {
            setTransactionType("expense");
            resetFormExceptType("expense");
          }
        }}
        variant={transactionType === "expense" ? "default" : "outline"}
        size="sm"
        className="flex items-center gap-2 px-4"
      >
        <CreditCard size={16} />
        <span>Gasto</span>
      </Button>
    </div>
  );

  // Botón de envío con estado de carga
  const SubmitButton = ({ className = "" }: { className?: string }) => (
    <Button type="button" disabled={loading} onClick={handleSubmit} className={className}>
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
        "Crear transacción"
      )}
    </Button>
  );

  // Componente responsivo - Desktop usa Sheet, Mobile/Tablet usa Drawer
  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button size="sm" className="">
            Nueva Transacción
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-3xl p-0">
          <SheetHeader className="sticky top-0 left-0 right-0 bg-background px-6 h-20 border-b flex flex-col justify-center z-10">
            <div className="flex flex-col items-center">
              <SheetTitle className="text-xl">
                {`Registrar nueva Transacción de ${selectedStore?.name}`}
              </SheetTitle>
              <TypeSwitcherButtons />
            </div>
          </SheetHeader>
          {/* Pestaña de productos SOLO para ingresos tipo ventas */}
          {transactionType === 'income' && transactionCategory === 'sales' && (
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="h-4 w-4" />
              <span>Productos disponibles</span>
            </div>
          )}
          {transactionType === "income" ? IncomeFormContent : ExpenseFormContent}
          {/* Footer */}
          <div className="h-16 bg-background flex flex-row justify-between items-center px-6 py-4 border-t sticky bottom-0 right-0">
            {/* Total */}
            <div className="">
              {transactionType === "income" && (
                <Badge className="bg-background text-primary text-lg py-2 px-3 hover:bg-background hover:text-primary">
                  Total: ${totalAmount.toFixed(2)}
                </Badge>
              )}
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
              <SubmitButton />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  } else {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <Button size="sm" className="" onClick={() => handleOpenChange(true)}>
          Nueva Transacción
        </Button>

        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="text-xl">
              Registrar nueva Transacción de {selectedStore?.name}
            </DrawerTitle>
            <TypeSwitcherButtons />
          </DrawerHeader>

          {/* Pestaña de productos SOLO para ingresos tipo ventas */}
          {transactionType === 'income' && transactionCategory === 'sales' && (
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="h-4 w-4" />
              <span>Productos disponibles</span>
            </div>
          )}

          {transactionType === "income" ? IncomeFormContent : ExpenseFormContent}

          {/* Footer para versión móvil */}
          <DrawerFooter className="border-t sticky bottom-0 right-0">
            <div className="flex justify-between items-center">
              {/* Total */}
              <div>
                {transactionType === "income" && (
                  <Badge className="bg-background text-primary text-lg py-2 px-3 hover:bg-background hover:text-primary">
                    Total: ${totalAmount.toFixed(2)}
                  </Badge>
                )}
              </div>
              <SubmitButton />
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
}