"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDb } from "@/providers/db-provider";
import { SalesService } from "@/lib/services/sales.service";
import { useState } from "react";

export function SalesCreateDialog() {
  const { selectedStore, employees, customers, refreshData } = useDb();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    customer_id: "",
    employee_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    
    setLoading(true);
    try {
      await SalesService.createSale({
        ...formData,
        store_id: selectedStore.id,
        total_amount: Number(formData.amount),
        sale_date: new Date().toISOString()
      });
      await refreshData();
      setFormData({ amount: "", customer_id: "", employee_id: "" });
      setOpen(false);
    } catch (error) {
      console.error("Error creating sale:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedStore) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Nueva Venta</Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Venta para {selectedStore.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Monto Total</Label>
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
              value={formData.customer_id}
              onValueChange={(value) => setFormData({...formData, customer_id: value})}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers
                  .filter(c => c.store_id === selectedStore.id)
                  .map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Empleado</Label>
            <Select
              value={formData.employee_id}
              onValueChange={(value) => setFormData({...formData, employee_id: value})}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar empleado" />
              </SelectTrigger>
              <SelectContent>
                {employees
                  .filter(e => e.store_id === selectedStore.id)
                  .map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
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