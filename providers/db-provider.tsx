"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { SalesService } from "@/lib/services/sales.service";
import { StoresService } from "@/lib/services/stores.service";
import { UsersService } from "@/lib/services/users.service";
import { CustomersService } from "@/lib/services/customers.service";
import { EmployeesService } from "@/lib/services/employees.service";
import { UserSettingsService } from "@/lib/services/user-settings.service";

type AppData = {
  user: any;
  stores: any[];
  sales: any[];
  customers: any[];
  employees: any[];
  selectedStore: any;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  setSelectedStore: (store: any) => void;
  createSale: (saleData: any) => Promise<void>;
};

const DbContext = createContext<AppData>({
  user: null,
  stores: [],
  sales: [],
  customers: [],
  employees: [],
  selectedStore: null,
  loading: true,
  error: null,
  refreshData: async () => {},
  setSelectedStore: () => {},
  createSale: async () => {},
});

export function DbProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistStoreSelection = async (store: any) => {
    if (!store) return;
    
    // Mantener lógica original de localStorage
    localStorage.setItem("selectedStore", JSON.stringify(store));
    setSelectedStore(store);
  
    // Nueva lógica para guardar en Supabase
    if (user?.id) {
      try {
        await UserSettingsService.updateLastStore(user.id, store.id);
      } catch (error) {
        console.error("Error guardando última tienda:", error);
      }
    }
  };

  const loadSalesForStore = async (storeId: string) => {
    try {
      const salesData = await SalesService.getStoreSales(storeId);
      setSales(salesData);
    } catch (err) {
      setError("Error cargando ventas");
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await UsersService.getCurrentUser();
      setUser(user);
  
      if (user) {
        const storesData = await StoresService.getUserStores(user.id);
        setStores(storesData);
  
        // Obtener de ambas fuentes
        const [savedLocalStore, savedDbStore] = await Promise.all([
          JSON.parse(localStorage.getItem("selectedStore") || "null"),
          UserSettingsService.getLastStore(user.id)
        ]);
  
        // Priorizar DB, luego localStorage, luego primera tienda
        const targetStore = storesData.find(s => s.id === savedDbStore) ||
                           storesData.find(s => s.id === savedLocalStore?.id) ||
                           storesData[0];
  
        if (targetStore) {
          setSelectedStore(targetStore); // No llamar a persistStoreSelection aquí
          await loadSalesForStore(targetStore.id);
        }
  
        // Obtener empleados y clientes asociados al usuario
        const [customersData, employeesData] = await Promise.all([
          CustomersService.getUserCustomers(user.id),
          EmployeesService.getUserEmployees(user.id)
        ]);
        setCustomers(customersData);
        setEmployees(employeesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSale = async (saleData: any) => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .insert(saleData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error("Error creando venta");
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedStore?.id) {
      loadSalesForStore(selectedStore.id);
    }
  }, [selectedStore?.id]);

  return (
    <DbContext.Provider
      value={{
        user,
        stores,
        sales,
        customers,
        employees,
        selectedStore,
        loading,
        error,
        refreshData: loadAllData,
        setSelectedStore: persistStoreSelection,
        createSale: handleCreateSale
      }}
    >
      {children}
    </DbContext.Provider>
  );
}

export const useDb = () => useContext(DbContext);
