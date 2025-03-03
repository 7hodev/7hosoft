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
  useSidebar
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useDb } from "@/providers/db-provider"
import { StoresService } from "@/lib/services/stores.service"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden" // Importar este componente

export function AddStoreDialog() {
  const { setOpen: setSidebarOpen } = useSidebar(); 
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { refreshData, setSelectedStore } = useDb()

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        setName("")
        setError("")
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          Nueva tienda
        </Button>
      </DialogTrigger>

      <DialogContent>
        {/* Añadir título accesible incluso para screen readers */}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la tienda"
            required
            disabled={loading}
          />

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
              {loading ? "Creando..." : "Crear"}
            </Button>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  )
}
