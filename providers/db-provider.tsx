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
      await UserSettingsService.upsertLastStore(user.id, store.id);
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

      const user = await UsersService.getCurrentUser();
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

  const handleCreateSale = async (saleData: any) => {
    try {
      await SalesService.createSale(saleData);
      await loadSalesForStore(selectedStore.id);
    } catch (error) {
      console.error("Error en DbProvider al crear venta:", error);
      if (error instanceof Error) {
        throw error; // Mantener el error original si es una instancia de Error
      } else {
        throw new Error("Error desconocido al crear la venta");
      }
    }
  };

  const getSaleProducts = async (saleId: string) => {
    try {
      // 1. Obtener productos vendidos
      const soldProductsData = await SoldProductsService.getSaleProducts(saleId);
      
      // 2. Obtener detalles de productos
      const productIds = soldProductsData.map(sp => sp.product_id);
      const productsData = await ProductsService.getProductsByIds(productIds);
  
      // 3. Combinar datos
      return soldProductsData.map(soldProduct => {
        const product = productsData.find(p => p.id === soldProduct.product_id) || {
          id: soldProduct.product_id,
          name: "Producto no encontrado",
          price: 0,
          stock: 0,
          store_id: selectedStore.id
        };
        
        return {
          soldProduct: {
            ...soldProduct,
            price: soldProduct.price || product.price // Usar precio de producto si es necesario
          },
          product
        };
      });
      
    } catch (error) {
      console.error("Error obteniendo productos:", error);
      return [];
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
        getStatusDisplay: SalesService.getStatusDisplay,
        getSaleProducts
      }}
    >
      {children}
    </DbContext.Provider>
  );
}

export const useDb = () => useContext(DbContext);