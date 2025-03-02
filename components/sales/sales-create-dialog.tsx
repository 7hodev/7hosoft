"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDb } from "@/providers/db-provider";
import { useEffect, useState } from "react";

export function SalesCreateDialog() {
  const { selectedStore, customers, employees, createSale, refreshData } = useDb();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    customer_id: "",
    employee_id: "",
  });
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mounted) return;
    
    setError(null);
    
    if (!selectedStore || !formData.customer_id || !formData.employee_id) {
      setError("Todos los campos son requeridos");
      return;
    }

    setLoading(true);
    
    try {
      await createSale({
        store_id: selectedStore.id,
        customer_id: formData.customer_id,
        employee_id: formData.employee_id,
        total_amount: Number(formData.amount),
        sale_date: new Date().toISOString()
      });
      
      await refreshData();
      setFormData({ amount: "", customer_id: "", employee_id: "" });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la venta");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Nueva Venta</Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Venta - {selectedStore?.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Monto Total (USD)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select
              key={`customer-${formData.customer_id}`} // Key dinámica
              value={formData.customer_id}
              onValueChange={(value) => setFormData({...formData, customer_id: value})}
              required
            >
              <SelectTrigger>
                <SelectValue>
                  {customers.find(c => c.id === formData.customer_id)?.name || "Seleccionar cliente"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem 
                    key={customer.id} 
                    value={customer.id}
                    data-state={customer.id === formData.customer_id ? "checked" : "unchecked"} // Estado visual
                  >
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Empleado</Label>
            <Select
              key={`employee-${formData.employee_id}`} // Key dinámica
              value={formData.employee_id}
              onValueChange={(value) => setFormData({...formData, employee_id: value})}
              required
            >
              <SelectTrigger>
                <SelectValue>
                  {employees.find(e => e.id === formData.employee_id)?.name || "Seleccionar empleado"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem 
                    key={employee.id} 
                    value={employee.id}
                    data-state={employee.id === formData.employee_id ? "checked" : "unchecked"} // Estado visual
                  >
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Venta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}