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
import { useStore } from "@/app/context/store-context"

export function AddStoreDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { refreshStores } = useStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error("Usuario no autenticado")

      const { error } = await supabase
        .from("stores")
        .insert([{ name, user_id: user.id }])

      if (error) throw error
      
      await refreshStores()
      setOpen(false)
      setName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear tienda")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          />
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
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