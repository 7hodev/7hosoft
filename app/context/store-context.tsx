"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"

type Store = {
  id: string
  name: string
  user_id: string
}

type StoreContextType = {
  selectedStore: Store | null
  setSelectedStore: (store: Store | null) => void
  stores: Store[]
  refreshStores: () => Promise<void>
}

const StoreContext = createContext<StoreContextType>({
  selectedStore: null,
  setSelectedStore: () => {},
  stores: [],
  refreshStores: async () => {},
})

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [stores, setStores] = useState<Store[]>([])

  // Cargar tiendas al iniciar
  useEffect(() => {
    refreshStores()
  }, [])

  // Persistir selección en localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedStore) {
        localStorage.setItem("selectedStore", JSON.stringify(selectedStore))
      } else {
        localStorage.removeItem("selectedStore")
      }
    }
  }, [selectedStore])

  const refreshStores = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)

      setStores(data || [])
      
      // Recuperar selección guardada
      const savedStore = typeof window !== "undefined" 
        ? JSON.parse(localStorage.getItem("selectedStore") || "")
        : null
      
      if (savedStore?.id) {
        const validStore = data?.find(store => store.id === savedStore.id)
        if (validStore) setSelectedStore(validStore)
      } else if (data?.[0]) {
        setSelectedStore(data[0])
      }
    }
  }

  return (
    <StoreContext.Provider 
      value={{ selectedStore, setSelectedStore, stores, refreshStores }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)