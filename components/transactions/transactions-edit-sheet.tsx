"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useDb } from "@/providers/db-provider";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { TransactionStatus, TransactionType, TransactionCategory } from "@/lib/services/transactions.service";
import { Product } from "@/lib/services/products.service";
import { SoldProduct } from "@/lib/services/sold_products.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useModal } from "@/components/contexts/modal-context";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, ShoppingCart, CreditCard, Edit, X, Save, Info, Plus } from "lucide-react";
import { TransactionsService } from "@/lib/services/transactions.service";
import { SoldProductsService } from "@/lib/services/sold_products.service";
import { CustomersService } from "@/lib/services/customers.service";
import { EmployeesService } from "@/lib/services/employees.service";
import { CustomerCreateSheet } from "@/components/customer/customer-create-sheet";

// Definir interfaces para los componentes personalizados
interface TabsProps {
  defaultValue?: string;
  className?: string;
  children: React.ReactNode;
}

interface TabListProps {
  className?: string;
  children: React.ReactNode;
}

interface TabProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

interface TabContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

// Componentes simplificados para evitar errores con props desconocidas
const Tabs: React.FC<TabsProps> = ({ defaultValue, className, children }) => {
  const [activeTab, setActiveTab] = useState<string>(defaultValue || "");
  
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      if (child.type === TabList) {
        return React.cloneElement(child as React.ReactElement<any>, {
          activeTab,
          setActiveTab
        });
      }
      if (child.type === TabContent) {
        return React.cloneElement(child as React.ReactElement<any>, {
          activeTab
        });
      }
    }
    return child;
  });
  
  return <div className={`flex flex-col w-full ${className || ''}`}>{childrenWithProps}</div>;
};

const TabList: React.FC<TabListProps & { activeTab?: string; setActiveTab?: (val: string) => void }> = ({ 
  children, 
  className,
  activeTab, 
  setActiveTab 
}) => {
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === Tab) {
      return React.cloneElement(child as React.ReactElement<any>, {
        isActive: activeTab === (child.props as any).value,
        setActiveTab
      });
    }
    return child;
  });
  
  return <div className={`flex border-b ${className || ''}`}>{childrenWithProps}</div>;
};

const Tab: React.FC<TabProps & { isActive?: boolean; setActiveTab?: (val: string) => void }> = ({ 
  value, 
  className,
  children, 
  isActive, 
  setActiveTab 
}) => {
  return (
    <button
      type="button"
      className={`px-4 py-2 ${
        isActive
          ? "border-b-2 border-primary font-medium text-primary"
          : "text-muted-foreground"
      } ${className || ''}`}
      onClick={() => setActiveTab && setActiveTab(value)}
    >
      {children}
    </button>
  );
};

const TabContent: React.FC<TabContentProps & { activeTab?: string }> = ({ 
  value, 
  className,
  children, 
  activeTab 
}) => {
  if (activeTab !== value) return null;
  return <div className={className || ''}>{children}</div>;
};

type SelectedProduct = Product & {
  soldProductId: string;
  quantity: number;
  originalQuantity: number;
};

interface TransactionsEditSheetProps {
  transactionId: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function TransactionsEditSheet({
  transactionId,
  open,
  onOpenChange,
  onSuccess,
  children,
}: TransactionsEditSheetProps) {
  const {
    selectedStore,
    customers,
    employees,
    products,
    updateTransaction,
    refreshData,
  } = useDb();

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setIsModalOpen } = useModal();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Data states
  const [formData, setFormData] = useState({
    customer_id: "",
    employee_id: "",
    recipient: "",
  });
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus>("pending");
  const [transactionDescription, setTransactionDescription] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [customerDisplayName, setCustomerDisplayName] = useState("Selecciona un cliente");
  const [employeeDisplayName, setEmployeeDisplayName] = useState("Selecciona un empleado");
  const [initialLoading, setInitialLoading] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>("income");
  const [transactionCategory, setTransactionCategory] = useState<TransactionCategory>("sales");
  const [transactionDate, setTransactionDate] = useState<string>("");
  const [isDeductible, setIsDeductible] = useState<boolean>(false);
  const [expenseAmount, setExpenseAmount] = useState<string>("0");

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const totalAmount = useMemo(() => {
    if (transactionType === "expense") {
      return parseFloat(expenseAmount) || 0;
    }
    
    return selectedProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [selectedProducts, transactionType, expenseAmount]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

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

  // Load transaction data
  useEffect(() => {
    if (isOpen && transactionId) {
      setInitialLoading(true);
      setError(null);
      
      const loadData = async () => {
        try {
          console.log("📌📌📌 INICIO CARGA DE TRANSACCIÓN PARA EDITAR ID:", transactionId);
          
          // Cargar la transacción
          const transaction = await TransactionsService.getTransaction(transactionId);
          console.log("📌 TRANSACCIÓN ENCONTRADA:", transaction);
          
          // Verificar el tipo y categoría para saber si necesitamos cargar productos
          const isIncome = transaction.type === 'income';
          const isSales = transaction.category === 'sales';
          
          // Actualizar la información de la transacción
          setTransactionType(transaction.type as TransactionType);
          setTransactionCategory(transaction.category as TransactionCategory);
          setTransactionDescription(transaction.description || "");
          setSelectedStatus(transaction.status as TransactionStatus);
          
          // Formatear la fecha correctamente para el campo datetime-local
          const date = transaction.sale_date ? 
            format(parseISO(transaction.sale_date), "yyyy-MM-dd'T'HH:mm") : 
            format(new Date(), "yyyy-MM-dd'T'HH:mm");
          setTransactionDate(date);
          
          setPaymentMethod(transaction.payment_method || "cash");
          setIsDeductible(!!transaction.deductible);
          
          setFormData({
            customer_id: transaction.customer_id || "",
            employee_id: transaction.employee_id || "",
            recipient: transaction.recipient || "",
          });
          
          // Resetear los productos seleccionados para evitar datos de transacciones anteriores
          setSelectedProducts([]);
          
          // Si es un ingreso de categoría ventas, cargar los productos vendidos
          if (isIncome && isSales) {
            console.log("📌 CARGANDO PRODUCTOS PARA VENTA...");
            setActiveTab("products"); // Activar pestaña de productos automáticamente
            
            try {
              const soldProductsData = await SoldProductsService.getTransactionProducts(transactionId);
              console.log("📌 PRODUCTOS RECIBIDOS DE API:", soldProductsData);
              
              if (!soldProductsData || !Array.isArray(soldProductsData) || soldProductsData.length === 0) {
                console.log("⚠️ NO SE ENCONTRARON PRODUCTOS PARA ESTA VENTA");
              } else {
                console.log("📌 NÚMERO DE PRODUCTOS ENCONTRADOS:", soldProductsData.length);
                
                // Obtener productos disponibles
                console.log("📌 PRODUCTOS DISPONIBLES:", products.length);
                
                // Mapear productos vendidos con sus datos completos
                const selectedProductsData = soldProductsData.map((soldProduct) => {
                  const productId = soldProduct.product_id;
                  console.log(`📌 BUSCANDO PRODUCTO ID: ${productId}`);
                  
                  const product = products.find((p) => p.id === productId);
                  console.log(`📌 PRODUCTO ENCONTRADO PARA ID ${productId}:`, product || "NO ENCONTRADO");
                  
                  if (product) {
                    console.log(`📌 PRODUCTO VÁLIDO ENCONTRADO: ${product.name}`);
                    return {
                      ...product,
                      soldProductId: soldProduct.id,
                      quantity: soldProduct.quantity,
                      originalQuantity: soldProduct.quantity,
                    };
                  } else {
                    console.log(`⚠️ PRODUCTO NO ENCONTRADO PARA ID ${productId}`);
                    // Crear un producto temporal para evitar errores
                    return {
                      id: productId,
                      name: `Producto ID: ${productId}`,
                      price: soldProduct.price || 0,
                      description: "Producto no encontrado en la base de datos",
                      soldProductId: soldProduct.id,
                      quantity: soldProduct.quantity,
                      originalQuantity: soldProduct.quantity,
                      store_id: soldProduct.store_id || "",
                      sku: "",
                      stock: 0,
                      category: "",
                      brand: "",
                      image_url: "",
                      is_active: true,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    };
                  }
                });
                
                console.log("📌 PRODUCTOS FINALES PARA MOSTRAR:", selectedProductsData);
                
                // Usar una actualización de estado garantizada
                setSelectedProducts(selectedProductsData);
              }
            } catch (error) {
              console.error("❌ ERROR AL CARGAR PRODUCTOS:", error);
              toast.error("No se pudieron cargar los productos de la transacción");
            }
          } 
          // Si no es de tipo venta, cargar el monto directamente
          else {
            console.log("📌 NO ES VENTA, CARGANDO MONTO TOTAL");
            setActiveTab("general"); // Activar pestaña general
            setExpenseAmount(transaction.total_amount.toString());
          }
          
          // Set display names
          if (transaction.customer_id) {
            try {
              const customer = await CustomersService.getCustomer(transaction.customer_id);
              if (customer) {
                console.log("📌 CLIENTE ENCONTRADO:", customer.name);
                setCustomerDisplayName(customer.name);
              } else {
                console.log("⚠️ CLIENTE NO ENCONTRADO");
                setCustomerDisplayName("Cliente no encontrado");
              }
            } catch (error) {
              console.error("❌ ERROR AL CARGAR CLIENTE:", error);
              setCustomerDisplayName("Error al cargar cliente");
            }
          }
          
          if (transaction.employee_id) {
            try {
              const employee = await EmployeesService.getEmployee(transaction.employee_id);
              if (employee) {
                console.log("📌 EMPLEADO ENCONTRADO:", employee.name);
                setEmployeeDisplayName(employee.name);
              } else {
                console.log("⚠️ EMPLEADO NO ENCONTRADO");
                setEmployeeDisplayName("Empleado no encontrado");
              }
            } catch (error) {
              console.error("❌ ERROR AL CARGAR EMPLEADO:", error);
              setEmployeeDisplayName("Error al cargar empleado");
            }
          }
        } catch (error) {
          console.error("❌❌❌ ERROR GENERAL CARGANDO LA TRANSACCIÓN:", error);
          setError("Error al cargar los datos de la transacción");
        } finally {
          setInitialLoading(false);
        }
      };
      
      loadData();
    }
  }, [isOpen, transactionId, products]);

  useEffect(() => {
    if (isOpen) {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
    
    return () => {
      setIsModalOpen(false);
    };
  }, [isOpen, setIsModalOpen]);

  useEffect(() => {
    if (formData.customer_id) {
      const customer = customers.find((c) => c.id === formData.customer_id);
      if (customer) {
        setCustomerDisplayName(customer.name);
      }
    }
  }, [formData.customer_id, customers]);

  useEffect(() => {
    if (formData.employee_id) {
      const employee = employees.find((e) => e.id === formData.employee_id);
      if (employee) {
        setEmployeeDisplayName(employee.name);
      }
    }
  }, [formData.employee_id, employees]);

  const handleQuantityChange = (productId: string, value: string) => {
    // Permitir que sea una cadena vacía
    if (value === "") {
      setSelectedProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, quantity: 0 } : p
        )
      );
      return;
    }
    
    // Convertir a número
    const numericValue = parseInt(value) || 0;
    
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, quantity: numericValue } : p
      )
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate form
      if (!selectedStore) {
        const errorMsg = "No hay una tienda seleccionada";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (transactionType === "income" && (!formData.customer_id || !formData.employee_id)) {
        const errorMsg = "Por favor selecciona un cliente y empleado";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (transactionType === "income" && transactionCategory === "sales" && selectedProducts.length === 0) {
        const errorMsg = "Debes agregar al menos un producto a la transacción";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if ((transactionType === "expense" || (transactionType === "income" && transactionCategory !== "sales")) && parseFloat(expenseAmount) <= 0) {
        const errorMsg = "El monto total debe ser mayor a cero";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      
      // Create updated transaction data
      const updatedData: any = {
        status: selectedStatus,
        description: transactionDescription,
        payment_method: paymentMethod,
        type: transactionType,
        category: transactionCategory,
        sale_date: transactionDate,
      };

      if (transactionType === "income") {
        updatedData.customer_id = formData.customer_id;
        updatedData.employee_id = formData.employee_id;
        updatedData.recipient = null;
        
        if (transactionCategory === "sales") {
          updatedData.total_amount = totalAmount;
          
          // Preparar productos para la actualización
          updatedData.products = selectedProducts.map((p) => ({
            id: p.id,
            quantity: p.quantity,
          }));
        } else {
          updatedData.total_amount = parseFloat(expenseAmount) || 0;
          updatedData.products = []; // Sin productos para otras categorías
        }
      } else {
        updatedData.customer_id = null;
        updatedData.employee_id = null;
        updatedData.recipient = formData.recipient;
        updatedData.total_amount = parseFloat(expenseAmount);
        updatedData.deductible = isDeductible;
      }
      
      // Update transaction
      if (transactionId) {
        console.log("Datos de actualización:", updatedData);
        const result = await TransactionsService.updateTransaction(transactionId, updatedData);
        console.log("Resultado de la actualización:", result);
        
        toast.success("Transacción actualizada correctamente");
        if (onSuccess) {
          onSuccess();
        }
        setTimeout(() => {
          refreshData();
        }, 500);
        handleOpenChange(false);
      }
    } catch (err) {
      console.error("Error updating transaction:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error al actualizar la transacción";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if any product quantity has changed from original
  const hasQuantityChanges = useMemo(() => {
    return selectedProducts.some(
      (product) => product.quantity !== product.originalQuantity
    );
  }, [selectedProducts]);

  const getCategoryText = (category: string): string => {
    switch(category) {
      case 'sales': return 'Ventas';
      case 'services': return 'Servicios';
      case 'investment_returns': return 'Retornos de inversión';
      case 'interest_income': return 'Ingresos por intereses';
      case 'rental_income': return 'Ingresos por alquiler';
      case 'refunds_received': return 'Reembolsos recibidos';
      case 'other_income': return 'Otros ingresos';
      
      case 'cost_of_goods_sold': return 'Costo de productos vendidos';
      case 'salaries_wages': return 'Salarios y sueldos';
      case 'rent': return 'Alquiler';
      case 'utilities': return 'Servicios públicos';
      case 'office_supplies': return 'Suministros de oficina';
      case 'marketing': return 'Marketing';
      case 'travel': return 'Viajes';
      case 'insurance': return 'Seguros';
      case 'professional_services': return 'Servicios profesionales';
      case 'equipment': return 'Equipamiento';
      case 'maintenance': return 'Mantenimiento';
      case 'taxes': return 'Impuestos';
      case 'refunds_issued': return 'Reembolsos emitidos';
      case 'other_expenses': return 'Otros gastos';
      
      default: return category;
    }
  };

  // Formatear precio en moneda
  const formatCurrency = (amount: number, includeSymbol = true): string => {
    const formatter = new Intl.NumberFormat('es-CO', {
      style: includeSymbol ? 'currency' : 'decimal',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(amount);
  };

  // Calcular total de productos
  const calculateTotal = (): number => {
    return selectedProducts.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
  };

  const getCategoryOptions = (type: TransactionType) => {
    switch (type) {
      case "income":
        return (
          <>
            <SelectItem value="sales">Ventas</SelectItem>
            <SelectItem value="services">Servicios</SelectItem>
            <SelectItem value="investment_returns">Retornos de inversión</SelectItem>
            <SelectItem value="interest_income">Ingresos por intereses</SelectItem>
            <SelectItem value="rental_income">Ingresos por alquiler</SelectItem>
            <SelectItem value="refunds_received">Reembolsos recibidos</SelectItem>
            <SelectItem value="other_income">Otros ingresos</SelectItem>
          </>
        );
      case "expense":
        return (
          <>
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
          </>
        );
    }
  };

  // Determinar qué categorías mostrar según el tipo
  useEffect(() => {
    switch (transactionType) {
      case "income":
        if (!["sales", "services", "investment_returns", "interest_income", "rental_income", "refunds_received", "other_income"].includes(transactionCategory)) {
          setTransactionCategory("sales");
        }
        break;
      case "expense":
        if (!["cost_of_goods_sold", "salaries_wages", "rent", "utilities", "office_supplies", "marketing", "travel", "insurance", "professional_services", "equipment", "maintenance", "taxes", "refunds_issued", "other_expenses"].includes(transactionCategory)) {
          setTransactionCategory("cost_of_goods_sold");
        }
        break;
    }
  }, [transactionType, transactionCategory]);

  // Mejorar significativamente la vista de productos para asegurar que se muestren siempre
  const renderProductsList = () => {
    console.log("📌 RENDERIZANDO LISTA DE PRODUCTOS: ", selectedProducts.length);
    
    if (selectedProducts.length === 0) {
      return (
        <div className="p-6 text-center">
          <p className="text-muted-foreground">
            No hay productos seleccionados
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Si debería haber productos, intente cerrar y abrir de nuevo el diálogo
          </p>
        </div>
      );
    }
    
    return (
      <>
        <div className="divide-y">
          {selectedProducts.map((product, index) => (
            <div key={index} className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{product.name || `Producto ID: ${product.id}`}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min="1"
                    value={product.quantity}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value) || 1;
                      handleQuantityChange(product.id, newValue.toString());
                    }}
                    className="w-20 h-8"
                  />
                  <span className="text-sm text-muted-foreground">
                    x {formatCurrency(product.price)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {formatCurrency(product.price * product.quantity)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedProducts(prev => 
                      prev.filter((_, i) => i !== index)
                    );
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 bg-muted/50 flex items-center justify-between">
          <p className="font-semibold">Total</p>
          <p className="font-semibold">
            {formatCurrency(calculateTotal())}
          </p>
        </div>
      </>
    );
  };

  // Form content for both mobile and desktop views
  const FormContent = (
    <div className="flex flex-col h-full overflow-y-auto space-y-5 px-4 py-2 pb-0 lg:pb-14">
      {initialLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <Tabs defaultValue="general" className="w-full">
          <TabList className="grid w-full grid-cols-2">
            <Tab
              value="general"
              className="flex items-center justify-center gap-2 py-2"
            >
              <Info className="h-4 w-4" />
              Información General
            </Tab>
            
            {/* Mostrar pestaña de productos SÓLO para ingresos tipo ventas */}
            {transactionType === 'income' && transactionCategory === 'sales' && (
              <Tab
                value="products"
                className="flex items-center justify-center gap-2 py-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Productos
              </Tab>
            )}
          </TabList>
          <TabContent value="general" className="mt-4 space-y-4">
            {/* Tipo de transacción */}
            <div className="flex flex-col gap-4">
              <div className="space-y-2 mb-0">
                <Label htmlFor="transaction-type">Tipo</Label>
                <div className="flex items-center">
                  <Badge 
                    variant={transactionType === "income" ? "default" : "destructive"} 
                    className="h-8 px-3 text-md capitalize"
                  >
                    {transactionType === "income" ? (
                      <ShoppingCart className="h-4 w-4 mr-1" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-1" />
                    )} 
                    {transactionType === "income" ? "Ingreso" : "Gasto"}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2 mb-0">
                <Label htmlFor="transaction-category">Categoría</Label>
                <Select
                  value={transactionCategory}
                  onValueChange={(value) => setTransactionCategory(value as TransactionCategory)}
                >
                  <SelectTrigger id="transaction-category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionType === 'income' ? (
                      <>
                        <SelectItem value="sales">{getCategoryText('sales')}</SelectItem>
                        <SelectItem value="services">{getCategoryText('services')}</SelectItem>
                        <SelectItem value="investment_returns">{getCategoryText('investment_returns')}</SelectItem>
                        <SelectItem value="interest_income">{getCategoryText('interest_income')}</SelectItem>
                        <SelectItem value="rental_income">{getCategoryText('rental_income')}</SelectItem>
                        <SelectItem value="refunds_received">{getCategoryText('refunds_received')}</SelectItem>
                        <SelectItem value="other_income">{getCategoryText('other_income')}</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="cost_of_goods_sold">{getCategoryText('cost_of_goods_sold')}</SelectItem>
                        <SelectItem value="salaries_wages">{getCategoryText('salaries_wages')}</SelectItem>
                        <SelectItem value="rent">{getCategoryText('rent')}</SelectItem>
                        <SelectItem value="utilities">{getCategoryText('utilities')}</SelectItem>
                        <SelectItem value="office_supplies">{getCategoryText('office_supplies')}</SelectItem>
                        <SelectItem value="marketing">{getCategoryText('marketing')}</SelectItem>
                        <SelectItem value="travel">{getCategoryText('travel')}</SelectItem>
                        <SelectItem value="insurance">{getCategoryText('insurance')}</SelectItem>
                        <SelectItem value="professional_services">{getCategoryText('professional_services')}</SelectItem>
                        <SelectItem value="equipment">{getCategoryText('equipment')}</SelectItem>
                        <SelectItem value="maintenance">{getCategoryText('maintenance')}</SelectItem>
                        <SelectItem value="taxes">{getCategoryText('taxes')}</SelectItem>
                        <SelectItem value="refunds_issued">{getCategoryText('refunds_issued')}</SelectItem>
                        <SelectItem value="other_expenses">{getCategoryText('other_expenses')}</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fecha y estado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as TransactionStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="canceled">Cancelada</SelectItem>
                    <SelectItem value="refunded">Reembolsada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cliente y Empleado - Solo para ingresos */}
            {transactionType === "income" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="employee">Empleado</Label>
                  <Select
                    value={formData.employee_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, employee_id: value });
                    }}
                  >
                    <SelectTrigger id="employee">
                      <SelectValue placeholder={employeeDisplayName} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {employees.length > 0 ? (
                          employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-employees" disabled>
                            No hay empleados disponibles
                          </SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Destinatario - Solo para gastos */}
            {transactionType === "expense" && (
              <div>
                <Label htmlFor="recipient">Destinatario</Label>
                <Input
                  id="recipient"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  placeholder="Nombre del destinatario"
                />
              </div>
            )}
            
            {/* Método de pago */}
            <div>
              <Label htmlFor="payment-method">Método de pago</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="credit_card">Tarjeta de crédito</SelectItem>
                  <SelectItem value="debit_card">Tarjeta de débito</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Campo de monto total para transacciones que no sean ventas */}
            {(transactionType === "expense" || (transactionType === "income" && transactionCategory !== "sales")) && (
              <div>
                <Label htmlFor="total-amount">Monto total</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="total-amount"
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
            
            {/* Descripción */}
            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                placeholder="Detalles adicionales sobre la transacción"
                className="resize-none"
              />
            </div>
          </TabContent>
          
          {transactionType === "income" && transactionCategory === "sales" && (
            <TabContent value="products" className="mt-4 space-y-4">
              <div className="border rounded-md">
                {renderProductsList()}
              </div>
            </TabContent>
          )}
        </Tabs>
      )}
    </div>
  );

  // Footer buttons for both mobile and desktop views
  const FooterButtons = (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        onClick={() => handleOpenChange(false)}
        disabled={loading}
      >
        Cancelar
      </Button>
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? (
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
            <span>Actualizando...</span>
          </div>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </>
        )}
      </Button>
    </div>
  );

  // Render mobile view (Drawer)
  if (!isDesktop) {
    return (
      <>
        {children}
        <Drawer open={isOpen} onOpenChange={handleOpenChange}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Editar Transacción</DrawerTitle>
            </DrawerHeader>
            {FormContent}
            <DrawerFooter className="pt-2">{FooterButtons}</DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Render desktop view (Sheet)
  return (
    <>
      {children}
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Transacción</SheetTitle>
            <SheetDescription>
              Modifica los detalles de la transacción
            </SheetDescription>
          </SheetHeader>
          {FormContent}
          <SheetFooter className="sticky bottom-0 pt-2 pb-4 bg-background border-t mt-auto px-4">
            {FooterButtons}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}