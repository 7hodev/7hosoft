"use client";

import React, { useState, useEffect } from "react";
import { useDb } from "@/providers/db-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { useMediaQuery } from "@/hooks/use-media-query";

interface CustomerEditSheetProps {
  customerId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  children?: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
}

export function CustomerEditSheet({
  customerId,
  open,
  onOpenChange,
  onSuccess,
  children,
  side,
}: CustomerEditSheetProps) {
  const { customers, refreshData } = useDb();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active",
    country: "",
    state: "",
    district: "",
    sub_district: "",
    neighborhood: "",
    gender: "",
    age: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        setFormData({
          name: customer.name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          status: customer.status || "active",
          country: customer.country || "",
          state: customer.state || "",
          district: customer.district || "",
          sub_district: customer.sub_district || "",
          neighborhood: customer.neighborhood || "",
          gender: customer.gender || "",
          age: customer.age ? String(customer.age) : "",
        });
      }
    }
  }, [isOpen, customerId, customers]);

  const handleOpenChange = (newOpenState: boolean) => {
    setInternalOpen(newOpenState);
    if (onOpenChange) {
      onOpenChange(newOpenState);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return false;
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("El formato del email es inválido");
      return false;
    }
    
    if (formData.age && isNaN(Number(formData.age))) {
      toast.error("La edad debe ser un número");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      const updateData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        status: formData.status,
        country: formData.country || null,
        state: formData.state || null,
        district: formData.district || null,
        sub_district: formData.sub_district || null,
        neighborhood: formData.neighborhood || null,
        gender: formData.gender || null,
        age: formData.age ? Number(formData.age) : null,
      };
      
      const { error: updateError } = await supabase
        .from("customers")
        .update(updateData)
        .eq("id", customerId);
      
      if (updateError) throw updateError;
      
      toast.success("Cliente actualizado con éxito");
      await refreshData();
      
      if (onSuccess) {
        onSuccess();
      }
      
      handleOpenChange(false);
    } catch (err: any) {
      console.error("Error al actualizar cliente:", err);
      setError(err.message || "Ocurrió un error al actualizar el cliente");
      toast.error(`Error al actualizar cliente: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderFormContent = () => (
    <>
      <div className="grid grid-cols-1 gap-4">
        {/* Nombre - campo obligatorio */}
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        
        {/* Información de contacto */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>
        
        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleSelectChange("status", value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Ubicación */}
        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
          <Input
            id="country"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="state">Estado/Provincia</Label>
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="district">Distrito</Label>
            <Input
              id="district"
              name="district"
              value={formData.district}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="sub_district">Subdistrito</Label>
            <Input
              id="sub_district"
              name="sub_district"
              value={formData.sub_district}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Vecindario</Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              value={formData.neighborhood}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        {/* Información personal */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="gender">Género</Label>
            <Select 
              value={formData.gender} 
              onValueChange={(value) => handleSelectChange("gender", value)}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Seleccionar género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Femenino</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="age">Edad</Label>
            <Input
              id="age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500 mt-2">{error}</div>
      )}
    </>
  );

  const renderFooterButtons = () => (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => handleOpenChange(false)}
        disabled={loading}
      >
        Cancelar
      </Button>
      <Button 
        type="submit" 
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </div>
  );

  // Renderizar según el tipo de dispositivo
  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
        <SheetContent 
          side={side || "right"} 
          className="w-full sm:max-w-xl h-full flex flex-col"
        >
          <SheetHeader>
            <SheetTitle>Editar Cliente</SheetTitle>
            <SheetDescription>
              Actualiza la información del cliente en el sistema.
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {renderFormContent()}
          </div>
          
          <SheetFooter className="sticky bottom-0 pt-4 pb-6 border-t mt-2 bg-background">
            {renderFooterButtons()}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  } else {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          {children}
        </DrawerTrigger>
        <DrawerContent className="flex flex-col max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Editar Cliente</DrawerTitle>
            <DrawerDescription>
              Actualiza la información del cliente en el sistema.
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 flex-1 overflow-y-auto">
            {renderFormContent()}
          </div>
          
          <DrawerFooter className="sticky bottom-0 pt-2 pb-6 border-t mt-2 bg-background">
            {renderFooterButtons()}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
} 