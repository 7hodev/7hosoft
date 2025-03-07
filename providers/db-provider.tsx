// app/context/db-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { SalesService, SaleStatus, StatusDisplayInfo } from "@/lib/services/sales.service";
import { StoresService } from "@/lib/services/stores.service";
import { UsersService } from "@/lib/services/users.service";
import { CustomersService } from "@/lib/services/customers.service";
import { EmployeesService } from "@/lib/services/employees.service";
import { UserSettingsService } from "@/lib/services/user_settings.service";
import { ProductsService, Product } from "@/lib/services/products.service";
import { SoldProductsService, SoldProduct } from "@/lib/services/sold_products.service";

type AppData = {
  user: any;
  stores: any[];
  sales: any[];
  customers: any[];
  employees: any[];
  products: Product[];
  soldProducts: SoldProduct[];
  selectedStore: any;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  setSelectedStore: (store: any) => Promise<void>;
  createSale: (saleData: any) => Promise<void>;
  updateSale: (saleId: string, updatedData: any) => Promise<void>;
  getStatusDisplay: (status: SaleStatus) => StatusDisplayInfo;
  getSaleProducts: (saleId: string) => Promise<{ product: Product; soldProduct: SoldProduct }[]>;
};

const DbContext = createContext<AppData>({
  user: null,
  stores: [],
  sales: [],
  customers: [],
  employees: [],
  products: [],
  soldProducts: [],
  selectedStore: null,
  loading: true,
  error: null,
  refreshData: async () => {},
  setSelectedStore: async () => {},
  createSale: async () => {},
  updateSale: async () => {},
  getStatusDisplay: () => ({ text: "", className: "" }),
  getSaleProducts: async () => [],
});

export function DbProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [soldProducts, setSoldProducts] = useState<SoldProduct[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistStoreSelection = async (store: any) => {
    if (!store?.id) {
      console.error("ID de tienda inválido");
      return;
    }

    try {
      let currentUser = user;
      if (!currentUser) {
        currentUser = await UsersService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          throw new Error("No se pudo obtener el usuario actual");
        }
      }
      
      await UserSettingsService.upsertLastStore(currentUser.id, store.id);
      localStorage.setItem("selectedStore", JSON.stringify(store));
      setSelectedStore(store);
    } catch (error) {
      console.error("Error al guardar tienda:", error);
      localStorage.setItem("selectedStore", JSON.stringify(store));
      setSelectedStore(store);
    }
  };

  const loadSalesForStore = async (storeId: string) => {
    try {
      const salesData = await SalesService.getStoreSales(storeId);
      setSales(salesData);
      
      const saleIds = salesData.map(sale => sale.id);
      const soldProductsData = await SoldProductsService.getSalesProducts(saleIds);
      setSoldProducts(soldProductsData);
    } catch (err) {
      setError("Error cargando ventas");
    }
  };

  const loadProductsForStore = async (storeId: string) => {
    try {
      const productsData = await ProductsService.getStoreProducts(storeId);
      setProducts(productsData);
    } catch (err) {
      setError("Error cargando productos");
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      let user = null;
      let retries = 0;
      while (!user && retries < 3) {
        user = await UsersService.getCurrentUser();
        if (!user) {
          retries++;
          if (retries < 3) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      setUser(user);

      if (user) {
        const storesData = await StoresService.getUserStores(user.id);
        setStores(storesData);

        const [dbStoreId, localStore] = await Promise.all([
          UserSettingsService.getLastStore(user.id),
          JSON.parse(localStorage.getItem("selectedStore") || "null")
        ]);

        const targetStore = storesData.find(s => s.id === dbStoreId) ||
                          storesData.find(s => s.id === localStore?.id) ||
                          storesData[0];

        if (targetStore) {
          await persistStoreSelection(targetStore);
          await Promise.all([
            loadSalesForStore(targetStore.id),
            loadProductsForStore(targetStore.id)
          ]);
        }

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

  const getSaleProducts = async (saleId: string) => {
    try {
      return await SalesService.getSaleProducts(saleId);
    } catch (error) {
      console.error("Error obteniendo productos:", error);
      return [];
    }
  };

  const handleCreateSale = async (saleData: any) => {
    try {
      const newSale = await SalesService.createSale(saleData);
      await loadSalesForStore(selectedStore.id);
      return newSale;
    } catch (error) {
      console.error("Error en DbProvider al crear venta:", error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Error desconocido al crear la venta");
      }
    }
  };

  const handleUpdateSale = async (saleId: string, updatedData: any) => {
    try {
      const result = await SalesService.updateSale(saleId, updatedData);
      await loadSalesForStore(selectedStore.id);
      return result;
    } catch (error) {
      console.error("Error en DbProvider al actualizar venta:", error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Error desconocido al actualizar la venta");
      }
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedStore?.id) {
      Promise.all([
        loadSalesForStore(selectedStore.id),
        loadProductsForStore(selectedStore.id)
      ]);
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
        products,
        soldProducts,
        selectedStore,
        loading,
        error,
        refreshData: loadAllData,
        setSelectedStore: persistStoreSelection,
        createSale: handleCreateSale,
        updateSale: handleUpdateSale,
        getStatusDisplay: SalesService.getStatusDisplay,
        getSaleProducts
      }}
    >
      {children}
    </DbContext.Provider>
  );
}

export const useDb = () => useContext(DbContext);
