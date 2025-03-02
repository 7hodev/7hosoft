"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useDb } from "@/providers/db-provider" // Cambiar importación
import { StoresService } from "@/lib/services/stores.service" // Agregar importación

export function AddStoreDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { refreshData, setSelectedStore } = useDb() // Cambiar contexto

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error("Usuario no autenticado")

      // Usar el servicio en lugar de Supabase directo
      const data = await StoresService.createStore(name, user.id)
      
      await refreshData() // Actualizar todos los datos
      setSelectedStore(data) // Seleccionar nueva tienda
      setOpen(false)
      setName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear tienda")
    } finally {
      setLoading(false)
    }
  }

  // Resto del componente permanece igual...
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
        <DialogHeader>
          <DialogTitle>Crear nueva tienda</DialogTitle>
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