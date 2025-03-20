"use client";

import React, { useState } from "react";
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
import { CustomersService } from "@/lib/services/customers.service";
import { Plus } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface CustomerCreateSheetProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function CustomerCreateSheet({ children, onSuccess }: CustomerCreateSheetProps) {
  const { refreshData, selectedStore, user } = useDb();
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
  const [open, setOpen] = useState(false);

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
    
    if (!user?.id) {
      toast.error("No se ha podido identificar al usuario");
      return false;
    }
    
    return true;
  };

  const resetForm = () => {
    setFormData({
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
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Usar el servicio mejorado para crear cliente asociado al usuario
      const customerData = await CustomersService.insertCustomer(formData, user!.id);
      
      toast.success("Cliente creado con éxito");
      await refreshData();
      resetForm();
      setOpen(false);
      
      // Llamar al callback onSuccess si existe
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Error al crear cliente:", err);
      setError(err.message || "Ocurrió un error al crear el cliente");
      toast.error(`Error al crear cliente: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar el contenido del formulario
  const renderFormContent = () => (
    <form className="space-y-4 py-4">
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
                <SelectItem value="not_specified">No especificado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="age">Edad</Label>
            <Input
              id="age"
              name="age"
              type="number"
              min="0"
              max="120"
              value={formData.age}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="text-sm text-red-500 mt-2">{error}</div>
      )}
    </form>
  );

  // Renderizar los botones del footer
  const renderFooterButtons = () => (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          resetForm();
          setOpen(false);
        }}
      >
        Cancelar
      </Button>
      <Button type="button" onClick={handleSubmit} disabled={loading}>
        {loading ? "Creando..." : "Crear Cliente"}
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {children || (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          )}
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-[500px] h-full flex flex-col"
        >
          <SheetHeader>
            <SheetTitle>Crear Nuevo Cliente</SheetTitle>
            <SheetDescription>
              Ingresa la información del nuevo cliente en el sistema.
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto">
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
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {children || (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent className="flex flex-col max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Crear Nuevo Cliente</DrawerTitle>
            <DrawerDescription>
              Ingresa la información del nuevo cliente en el sistema.
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