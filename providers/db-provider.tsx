"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { StoresService } from "@/lib/services/stores.service";
import { SalesService } from "@/lib/services/sales.service";
import { UsersService } from "@/lib/services/users.service";
import { EmployeesService } from "@/lib/services/employees.service";
import { CustomersService } from "@/lib/services/customers.service";

type AppData = {
  user: any;
  stores: any[];
  sales: any[];
  employees: any[];
  customers: any[];
  selectedStore: any;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  setSelectedStore: (store: any) => void;
};

const DbContext = createContext<AppData>({
  user: null,
  stores: [],
  sales: [],
  employees: [],
  customers: [],
  selectedStore: null,
  loading: true,
  error: null,
  refreshData: async () => {},
  setSelectedStore: function (store: any): void {
    throw new Error("Function not implemented.");
  },
});

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Cargar usuario
      const currentUser = await UsersService.getCurrentUser();
      setUser(currentUser);

      let storesData: any[] = [];

      // Cargar tiendas
      if (currentUser) {
        const storesData = await StoresService.getUserStores(currentUser.id);
        setStores(storesData);

        // Cargar ventas de la primera tienda
        if (storesData.length > 0) {
          const salesData = await SalesService.getStoreSales(storesData[0].id);
          setSales(salesData);
        }
      }

      if (currentUser) {
        // Corregir la redeclaración de storesData
        storesData = await StoresService.getUserStores(currentUser.id);
        setStores(storesData);

        if (storesData.length > 0) {
          const salesData = await SalesService.getStoreSales(storesData[0].id);
          setSales(salesData);

          // Cargar empleados y clientes de la primera tienda
          const employeesData = await EmployeesService.getStoreEmployees(
            storesData[0].id
          );
          const customersData = await CustomersService.getStoreCustomers(
            storesData[0].id
          );
          setEmployees(employeesData);
          setCustomers(customersData);
          setSelectedStore(storesData[0]);
        }
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadStoreDependentData = async (storeId: string) => {
    try {
      const [sales, employees, customers] = await Promise.all([
        SalesService.getStoreSales(storeId),
        EmployeesService.getStoreEmployees(storeId),
        CustomersService.getStoreCustomers(storeId),
      ]);

      setSales(sales);
      setEmployees(employees);
      setCustomers(customers);
    } catch (err) {
      // Manejo de errores
    }
  };

  // Actualizar el useEffect para cargar datos cuando cambia la tienda
  useEffect(() => {
    if (selectedStore?.id) {
      loadStoreDependentData(selectedStore.id);
    }
  }, [selectedStore?.id]);

  return (
    <DbContext.Provider
      value={{
        user,
        stores,
        sales,
        employees,
        customers,
        selectedStore,
        loading,
        error,
        refreshData: loadAllData,
        setSelectedStore,
      }}
    >
      {children}
    </DbContext.Provider>
  );
}

export const useDb = () => useContext(DbContext);
