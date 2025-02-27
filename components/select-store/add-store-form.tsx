"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useStore } from "@/app/context/store-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AddStoreForm({ onClose }: { onClose: () => void }) {
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
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear tienda")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la tienda"
        required
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Crear"}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  )
}