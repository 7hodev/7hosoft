"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Switch } from "../ui/switch"
import { Label } from "../ui/label"
import { Separator } from "../ui/separator"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useConfigContext } from "@/components/contexts/config-context"
import { PersonType } from "@/lib/services/user_settings.service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useDb } from "@/providers/db-provider"

export const BusinessConfig = () => {
  const { userSettings, refresh } = useConfigContext()
  const { user, updatePersonType, refreshData } = useDb()
  const [isCorporate, setIsCorporate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    // Inicializar el estado usando la información del usuario
    const initializeState = () => {
      console.log("User settings:", user?.settings);
      if (user?.settings?.person_type) {
        const personType = user.settings.person_type.toLowerCase();
        console.log("Person type desde useDb:", personType);
        setIsCorporate(personType === "corporate");
      }
    };
    
    initializeState();
  }, [user]);

  const handleTogglePersonType = () => {
    // Solo mostrar el diálogo de confirmación
    setShowConfirmDialog(true);
  }

  const confirmPersonTypeChange = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Obtener el nuevo tipo (el opuesto al actual)
      const newPersonType: PersonType = isCorporate ? "individual" : "corporate";
      console.log(`Cambiando de ${isCorporate ? "corporate" : "individual"} a ${newPersonType}`);
      
      // Actualizar en la base de datos
      await updatePersonType(newPersonType);
      
      // Actualizar la UI
      setIsCorporate(!isCorporate);
      
      // Mostrar mensaje de éxito
      toast.success(`Tipo de persona actualizado a ${!isCorporate ? 'Jurídica' : 'Natural'}`);
      
      // Refrescar datos
      await refreshData();
      if (refresh) await refresh();
    } catch (error) {
      console.error("Error al actualizar tipo de persona:", error);
      toast.error("Error al actualizar la configuración");
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuración del Negocio</CardTitle>
        <CardDescription>Administra la configuración fiscal de tu negocio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="person-type">Tipo de Persona</Label>
              <p className="text-sm text-muted-foreground">
                {isCorporate ? "Jurídica (empresa, sociedad)" : "Natural (persona física)"}
              </p>
            </div>
            <div>
              <Switch
                id="person-type"
                checked={isCorporate}
                onCheckedChange={handleTogglePersonType}
                disabled={isLoading}
              />
            </div>
          </div>
          <Separator />

          {/* Alerta de advertencia sobre el cambio */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Advertencia</AlertTitle>
            <AlertDescription>
              Cambiar el tipo de persona afectará el cálculo del impuesto sobre la renta. 
              Asegúrate de hacer este cambio solo si corresponde a tu situación fiscal real.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>

      {/* Diálogo de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar Tipo de Persona</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cambiará tu tipo de persona de {isCorporate ? "Jurídica a Natural" : "Natural a Jurídica"}.
              <br /><br />
              <strong>Esto afectará el cálculo del impuesto sobre la renta.</strong>
              <br /><br />
              ¿Estás seguro de que deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPersonTypeChange} disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
} 