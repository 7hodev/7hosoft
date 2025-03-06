"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useDb } from "@/providers/db-provider";
import { useEffect, useState } from "react";
import { SaleStatus } from "@/lib/services/sales.service";
import { Product } from '@/lib/services/products.service';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface SalesEditDialogProps {
  saleId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SalesEditDialog({ saleId, isOpen, onOpenChange }: SalesEditDialogProps) {
  const {
    selectedStore,
    customers,
    employees,
    products,
    sales,
    updateSale,
    refreshData,
    getSaleProducts
  } = useDb();

  const [formData, setFormData] = useState({
    customer_id: "",
    employee_id: "",
  });
  const [selectedStatus, setSelectedStatus] = useState<SaleStatus>('pending');
  const [selectedProducts, setSelectedProducts] = useState<Array<Product & { quantity: number | string }>>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStockWarning, setShowStockWarning] = useState<{ productId: string, warning: string } | null>(null);

  // Nombres para mostrar en selects
  const [customerDisplayName, setCustomerDisplayName] = useState("Selecciona un cliente");
  const [employeeDisplayName, setEmployeeDisplayName] = useState("Selecciona un empleado");

  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Cargar datos de la venta en modo edición
  useEffect(() => {
    const loadSaleData = async () => {
      if (saleId && isOpen) {
        setLoadingInitialData(true);
        try {
          // Buscar la venta por ID
          const sale = sales.find(sale => sale.id === saleId);
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
          const customer = customers.find(c => c.id === sale.customer_id);
          if (customer) setCustomerDisplayName(customer.name);
          
          const employee = employees.find(e => e.id === sale.employee_id);
          if (employee) setEmployeeDisplayName(employee.name);
          
          // Cargar productos de la venta
          const saleProducts = await getSaleProducts(saleId);
          
          // Convertir a formato para el formulario
          const formattedProducts = saleProducts.map(({ product, soldProduct }) => ({
            ...product,
            quantity: soldProduct.quantity
          }));
          
          setSelectedProducts(formattedProducts);
        } catch (error) {
          console.error("Error al cargar datos de la venta:", error);
          toast.error("Error al cargar la información de la venta");
        } finally {
          setLoadingInitialData(false);
        }
      }
    };
    
    loadSaleData();
  }, [saleId, isOpen, sales, customers, employees, getSaleProducts]);

  // Actualizar nombres cuando cambian las selecciones
  useEffect(() => {
    if (formData.customer_id) {
      const customer = customers.find(c => c.id === formData.customer_id);
      if (customer) {
        setCustomerDisplayName(customer.name);
      }
    } else {
      setCustomerDisplayName("Selecciona un cliente");
    }
  }, [formData.customer_id, customers]);

  useEffect(() => {
    if (formData.employee_id) {
      const employee = employees.find(e => e.id === formData.employee_id);
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
      'pending': 'Pendiente',
      'completed': 'Completada',
      'canceled': 'Cancelada'
    };
    return statusMap[selectedStatus] || 'Selecciona un estado';
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const totalAmount = selectedProducts.reduce((acc, product) => {
    const quantity = typeof product.quantity === 'string' ?
      (product.quantity === '' ? 0 : parseInt(product.quantity)) :
      product.quantity;
    return acc + (product.price * (quantity || 0));
  }, 0);

  const handleProductSelect = (product: Product) => {
    // Evitar duplicados
    if (selectedProducts.some(p => p.id === product.id)) {
      return;
    }

    setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const numValue = value === '' ? '' : parseInt(value);
    
    // Actualizar la cantidad del producto
    setSelectedProducts(prevProducts => {
      return prevProducts.map(product => {
        if (product.id === productId) {
          // Verificar si hay suficiente stock
          if (typeof numValue === 'number' && numValue > product.stock) {
            setShowStockWarning({
              productId,
              warning: `Solo hay ${product.stock} unidades disponibles`
            });
          } else {
            setShowStockWarning(null);
          }
          
          // Importante: devolver un objeto que extiende Product correctamente
          return { ...product, quantity: numValue };
        }
        return product;
      }) as (Product & { quantity: string | number })[];
    });
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    if (showStockWarning?.productId === productId) {
      setShowStockWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar campos requeridos
    if (!selectedStore || !formData.customer_id || !formData.employee_id) {
      setError('Por favor selecciona una tienda, cliente y empleado');
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    // Validar que haya productos seleccionados
    if (selectedProducts.length === 0) {
      setError('Por favor selecciona al menos un producto');
      toast.error('Por favor selecciona al menos un producto');
      return;
    }

    // Validar que todas las cantidades sean válidas
    const invalidProduct = selectedProducts.find(product => {
      const quantity = typeof product.quantity === 'string' 
        ? (product.quantity === '' ? 0 : parseInt(product.quantity))
        : product.quantity;
      return quantity <= 0;
    });

    if (invalidProduct) {
      setError(`La cantidad para ${invalidProduct.name} debe ser mayor a cero`);
      toast.error('Las cantidades deben ser mayores a cero');
      return;
    }

    // Preparar datos para actualizar
    const saleData = {
      customer_id: formData.customer_id,
      employee_id: formData.employee_id,
      status: selectedStatus,
      total_amount: totalAmount,
      products: selectedProducts.map(product => ({
        id: product.id,
        quantity: typeof product.quantity === 'string' 
          ? parseInt(product.quantity) 
          : product.quantity
      }))
    };

    setLoading(true);
    
    try {
      await updateSale(saleId, saleData);
      toast.success('Venta actualizada con éxito');
      onOpenChange(false);
      await refreshData();
    } catch (err) {
      console.error("Error al actualizar venta:", err);
      
      let errorMessage = "Error al actualizar la venta";
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
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[calc(90vh-8rem)]">
      <div className="flex-1 overflow-y-auto px-6 py-2">
        <div className="space-y-4">
          {/* Cliente y Empleado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Cliente</Label>
              <Select 
                value={formData.customer_id} 
                onValueChange={(value) => setFormData({...formData, customer_id: value})}
              >
                <SelectTrigger id="customer">
                  <SelectValue placeholder={customerDisplayName} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="employee">Empleado</Label>
              <Select 
                value={formData.employee_id} 
                onValueChange={(value) => setFormData({...formData, employee_id: value})}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder={employeeDisplayName} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Estado de la venta */}
          <div className="space-y-2">
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
          
          {/* Productos Seleccionados */}
          <div className="space-y-2">
            <Label>Productos seleccionados</Label>
            {selectedProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No hay productos seleccionados</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {selectedProducts.map(product => (
                  <Card key={product.id} className="relative">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Precio: ${product.price.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="w-20">
                          <Input 
                            type="number" 
                            value={product.quantity.toString()} 
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            min="1"
                            className="w-full"
                          />
                          {showStockWarning?.productId === product.id && (
                            <p className="text-xs text-red-500 mt-1">{showStockWarning.warning}</p>
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
          
          {/* Selector de Productos */}
          <div className="space-y-2">
            <Label htmlFor="selectProduct">Añadir producto</Label>
            <Select onValueChange={(value) => {
              const selectedProduct = products.find(p => p.id === value);
              if (selectedProduct) {
                handleProductSelect(selectedProduct);
              }
            }}>
              <SelectTrigger id="selectProduct">
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter(product => !selectedProducts.some(p => p.id === product.id))
                  .map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ${product.price.toFixed(2)} - Stock: {product.stock}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Total */}
          <div className="pt-4 flex justify-end">
            <Badge variant="outline" className="text-lg py-2 px-3">
              Total: ${totalAmount.toFixed(2)}
            </Badge>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    
      <DialogFooter className="px-6 py-4 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Guardando...</span>
            </div>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </DialogFooter>
    </form>
  );

  const LoadingContent = (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center space-x-2">
        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Cargando información de la venta...</span>
      </div>
    </div>
  );

  // Componente responsivo - Desktop usa Dialog, Mobile/Tablet usa Drawer
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl">
              Editar Venta #{saleId && typeof saleId === 'string' ? saleId.slice(-4) : ''}
            </DialogTitle>
            <DialogDescription>
              Modifica la información de la venta
            </DialogDescription>
          </DialogHeader>
          
          {loadingInitialData ? LoadingContent : FormContent}
        </DialogContent>
      </Dialog>
    );
  } else {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="text-xl">
              Editar Venta #{saleId && typeof saleId === 'string' ? saleId.slice(-4) : ''}
            </DrawerTitle>
          </DrawerHeader>
          
          {loadingInitialData ? LoadingContent : FormContent}
        </DrawerContent>
      </Drawer>
    );
  }
} 