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
  isLoading: boolean
  refreshStores: () => Promise<void>
}

const StoreContext = createContext<StoreContextType>({
  selectedStore: null,
  setSelectedStore: () => {},
  stores: [],
  isLoading: true,
  refreshStores: async () => {},
})

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshStores = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from("stores")
          .select("*")
          .eq("user_id", user.id)

        setStores(data || [])

        // Recuperar selección guardada
        const savedStore = localStorage.getItem("selectedStore")
        if (savedStore) {
          try {
            const parsedStore = JSON.parse(savedStore)
            const validStore = data?.find(store => store.id === parsedStore.id)
            if (validStore) {
              setSelectedStore(validStore)
              return
            }
          } catch (error) {
            console.error("Error parsing stored store:", error)
            localStorage.removeItem("selectedStore")
          }
        }

        // Establecer primera tienda si no hay selección
        if (data?.[0] && !selectedStore) {
          setSelectedStore(data[0])
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshStores()
  }, [])

  useEffect(() => {
    if (selectedStore) {
      localStorage.setItem("selectedStore", JSON.stringify(selectedStore))
    }
  }, [selectedStore])

  return (
    <StoreContext.Provider 
      value={{ selectedStore, setSelectedStore, stores, isLoading, refreshStores }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)