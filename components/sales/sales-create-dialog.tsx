"use client";

import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
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
import { useEffect, useState, useRef } from "react";
import { SaleStatus } from "@/lib/services/sales.service";
import { Product } from '@/lib/services/products.service';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function SalesCreateDialog() {
  const { 
    selectedStore, 
    customers, 
    employees, 
    products, 
    createSale, 
    refreshData 
  } = useDb();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    employee_id: "",
  });
  const [selectedStatus, setSelectedStatus] = useState<SaleStatus>('pending');
  const [selectedProducts, setSelectedProducts] = useState<Array<Product & {quantity: number | string}>>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStockWarning, setShowStockWarning] = useState<{productId: string, warning: string} | null>(null);
  
  // Nombres para mostrar en selects
  const [customerDisplayName, setCustomerDisplayName] = useState("Selecciona un cliente");
  const [employeeDisplayName, setEmployeeDisplayName] = useState("Selecciona un empleado");

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
      'cancelled': 'Cancelada'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar campos requeridos
    if (!selectedStore || !formData.customer_id || !formData.employee_id) {
      setError('Por favor selecciona una tienda, cliente y empleado');
      return;
    }

    // Validar productos
    if (selectedProducts.length === 0) {
      setError('Debes seleccionar al menos un producto');
      return;
    }

    // Validar cantidades
    const productsWithInvalidQuantity = selectedProducts.filter(p => {
      if (typeof p.quantity === 'string') {
        return !p.quantity || p.quantity === '';
      }
      return !p.quantity || p.quantity <= 0;
    });
    
    if (productsWithInvalidQuantity.length > 0) {
      setError(`Los siguientes productos tienen cantidades inválidas: ${productsWithInvalidQuantity.map(p => p.name).join(', ')}`);
      return;
    }

    // Convertir cantidades a números para validación de stock
    const productsWithNumericQuantity = selectedProducts.map(p => ({
      ...p,
      quantity: typeof p.quantity === 'string' ? parseInt(p.quantity) || 0 : p.quantity
    }));

    // Validar stock
    const stockValidation = productsWithNumericQuantity.find(p => p.quantity > p.stock);
    if (stockValidation) {
      setError(`No hay suficiente stock para "${stockValidation.name}". Solo hay ${stockValidation.stock} unidades disponibles.`);
      return;
    }

    setLoading(true);
    
    try {
      // Asegurarnos que solo enviamos estados válidos (pending/completed)
      // Si en el futuro la base de datos soporta 'cancelled', solo elimina esta validación
      const validStatus: SaleStatus = selectedStatus === 'cancelled' ? 'pending' : selectedStatus;
      
      await createSale({
        store_id: selectedStore.id,
        customer_id: formData.customer_id,
        employee_id: formData.employee_id,
        sale_date: new Date().toISOString(),
        status: validStatus, // Usamos el estado validado
        total_amount: totalAmount,
        products: productsWithNumericQuantity.map(p => ({
          id: p.id, 
          quantity: p.quantity
        }))
      });
      
      // Resetear formulario
      setFormData({ customer_id: "", employee_id: "" });
      setSelectedProducts([]);
      setCustomerDisplayName("Selecciona un cliente");
      setEmployeeDisplayName("Selecciona un empleado");
      setOpen(false);
      refreshData();
    } catch (err) {
      console.error("Error en SalesCreateDialog:", err);
      let errorMessage = 'Error al crear la venta';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Nueva Venta</Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">Nueva Venta - {selectedStore?.name}</DialogTitle>
          <DialogDescription>
            Completa el formulario para registrar una nueva venta
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="space-y-6 px-6 py-4 overflow-y-hidden">
            {error && (
              <div className="bg-red-50 text-red-700 p-2 rounded border border-red-200 flex items-center text-sm">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer" className="text-base font-medium">Cliente *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({...formData, customer_id: value})}
                    required
                  >
                    <SelectTrigger id="customer" className="w-full mt-1.5">
                      <span className="truncate">{customerDisplayName}</span>
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

                <div>
                  <Label htmlFor="employee" className="text-base font-medium">Empleado *</Label>
                  <Select
                    value={formData.employee_id}
                    onValueChange={(value) => setFormData({...formData, employee_id: value})}
                    required
                  >
                    <SelectTrigger id="employee" className="w-full mt-1.5">
                      <span className="truncate">{employeeDisplayName}</span>
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

                <div>
                  <Label htmlFor="status-select" className="text-base font-medium">Estado *</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value as SaleStatus)}
                    required
                  >
                    <SelectTrigger id="status-select" className="w-full mt-1.5">
                      <span className="truncate">{getStatusText()}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedStatus === 'cancelled' && (
                    <div className="text-amber-600 text-xs mt-1.5">
                      Nota: El estado Cancelada se guardará como Pendiente por limitaciones de la base de datos
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium">Total de la Venta</Label>
                  <div className="mt-1.5 text-2xl font-bold text-green-700">${totalAmount.toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium">Productos *</Label>
                  <Select
                    onValueChange={(value) => {
                      const product = products.find(p => p.id === value);
                      if (product && !selectedProducts.some(p => p.id === value)) {
                        setSelectedProducts(prev => [...prev, { ...product, quantity: "" as any }]);
                      }
                    }}
                  >
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Añadir producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products
                        .filter(product => !selectedProducts.some(p => p.id === product.id))
                        .map((product) => (
                          <SelectItem 
                            key={product.id} 
                            value={product.id}
                            disabled={product.stock <= 0}
                          >
                            <div className="flex justify-between w-full">
                              <span>{product.name}</span>
                              {product.stock > 0 ? (
                                <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                              ) : (
                                <span className="text-sm text-red-500">Sin stock</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="h-[250px] overflow-y-auto border rounded-md bg-gray-50 p-2">
                  {selectedProducts.length === 0 ? (
                    <div className="text-sm text-gray-500 italic p-4 border border-dashed border-gray-300 rounded-md text-center h-full flex items-center justify-center">
                      No hay productos seleccionados. Utiliza el selector para añadir productos.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedProducts.map((product) => {
                        const hasStockWarning = showStockWarning && showStockWarning.productId === product.id;
                        
                        return (
                          <Card key={product.id} className="bg-white">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium text-lg">{product.name}</div>
                                  <div className="mt-1 flex items-center space-x-3">
                                    <Badge variant="outline" className="text-blue-700 bg-blue-50">
                                      ${product.price.toFixed(2)}
                                    </Badge>
                                    <Badge variant="outline" className="text-green-700 bg-green-50">
                                      Stock: {product.stock}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <div className="relative">
                                    <Label htmlFor={`quantity-${product.id}`} className="sr-only">Cantidad</Label>
                                    <Input
                                      id={`quantity-${product.id}`}
                                      type="number"
                                      placeholder="Cantidad"
                                      min="1"
                                      max={product.stock}
                                      value={product.quantity}
                                      onChange={(e) => {
                                        const newValue = e.target.value;
                                        
                                        if (newValue === '') {
                                          // Permitir campo vacío
                                          setSelectedProducts(prev =>
                                            prev.map(p =>
                                              p.id === product.id ? { ...p, quantity: newValue as any } : p
                                            )
                                          );
                                          return;
                                        }
                                        
                                        const numValue = parseInt(newValue);
                                        
                                        if (isNaN(numValue)) return;
                                        
                                        // Validar que no exceda el stock
                                        const finalValue = Math.min(Math.max(1, numValue), product.stock);
                                        
                                        setSelectedProducts(prev =>
                                          prev.map(p =>
                                            p.id === product.id ? { ...p, quantity: finalValue } : p
                                          )
                                        );
                                        
                                        // Mostrar advertencia si intenta exceder el stock
                                        if (!isNaN(numValue) && numValue > product.stock) {
                                          setShowStockWarning({
                                            productId: product.id,
                                            warning: `Máximo: ${product.stock}`
                                          });
                                          setTimeout(() => setShowStockWarning(null), 3000);
                                        }
                                      }}
                                      className="w-24"
                                    />
                                    
                                    {hasStockWarning && (
                                      <div className="absolute top-full right-0 bg-yellow-100 text-yellow-800 p-1 text-xs rounded-md z-10 mt-1 whitespace-nowrap">
                                        {showStockWarning!.warning}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedProducts(prev => prev.filter(p => p.id !== product.id))}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 border-t">
            <div className="flex justify-end gap-3 w-full">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={loading}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-6"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando...
                  </div>
                ) : (
                  "Crear Venta"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}