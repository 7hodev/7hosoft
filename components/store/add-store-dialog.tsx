"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer"
import {
  useSidebar
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input"
import { useState, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { useDb } from "@/providers/db-provider"
import { StoresService } from "@/lib/services/stores.service"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useMediaQuery } from "@/hooks/use-media-query"

export function AddStoreDialog() {
  const { setOpen: setSidebarOpen } = useSidebar(); 
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { refreshData, setSelectedStore } = useDb()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error("Usuario no autenticado")

      const data = await StoresService.createStore(name, user.id)
      await refreshData()
      setSelectedStore(data)
      setOpen(false)
      setSidebarOpen(false);
      setName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear tienda")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    
    // Si se está cerrando, resetear el formulario
    if (!isOpen) {
      setName("")
      setError("")
    }
  }

  // Contenido del formulario compartido entre Dialog y Drawer
  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la tienda"
        required
        disabled={loading}
      />

      <div className="flex justify-end gap-2">
        {isMobile ? (
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
            >
              Cancelar
            </Button>
          </DrawerClose>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Crear"}
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  )

  // Renderizado condicional basado en el tamaño de pantalla
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
          >
            Nueva tienda
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-lg font-semibold tracking-tight">
              Nueva tienda
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Crea una nueva tienda para gestionar productos y ventas
            </p>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <FormContent />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-start"
        >
          Nueva tienda
        </Button>
      </DialogTrigger>

      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>Crear nueva tienda</DialogTitle>
        </VisuallyHidden>

        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Nueva tienda
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Crea una nueva tienda para gestionar productos y ventas
          </p>
        </DialogHeader>

        <FormContent />
      </DialogContent>
    </Dialog>
  )
}
