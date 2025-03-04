// app/context/db-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { SalesService, StatusDisplayInfo, SaleStatus } from "@/lib/services/sales.service";
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
  setSelectedStore: (store: any) => void;
  createSale: (saleData: any) => Promise<void>;
  getStatusDisplay: (status: SaleStatus) => StatusDisplayInfo;
  getSaleProducts: (saleId: string) => Promise<{product: Product, soldProduct: SoldProduct}[]>;
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
  refreshData: async () => { },
  setSelectedStore: () => { },
  createSale: async () => { },
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
    if (!store?.id || typeof store.id !== "number") {
      console.error("ID de tienda inválido");
      return;
    }

    try {
      // Guardar en Supabase
      await UserSettingsService.upsertLastStore(user.id, store.id);
      
      // Actualizar estado local
      setSelectedStore(store);
      
      // Guardar en localStorage como respaldo
      localStorage.setItem("selectedStore", JSON.stringify(store));
      
    } catch (error) {
      console.error("Error al guardar última tienda:", error);
      // Fallback a localStorage
      localStorage.setItem("selectedStore", JSON.stringify(store));
      setSelectedStore(store);
    }
  };

  const loadSalesForStore = async (storeId: string) => {
    try {
      const salesData = await SalesService.getStoreSales(storeId);
      setSales(salesData);
      
      // Cargar productos vendidos para todas las ventas
      if (salesData.length) {
        const saleIds = salesData.map(sale => sale.id);
        const soldProductsData = await SoldProductsService.getSalesProducts(saleIds);
        setSoldProducts(soldProductsData);
      }
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
        // Cargar tiendas del usuario
        const storesData = await StoresService.getUserStores(user.id);
        setStores(storesData);

        // Obtener última tienda de 2 fuentes
        const [dbStoreId, localStore] = await Promise.all([
          UserSettingsService.getLastStore(user.id),
          JSON.parse(localStorage.getItem("selectedStore") || "null")
        ]);

        // Buscar tienda priorizando: Supabase > localStorage > primera tienda
        const targetStore = storesData.find(s => s.id === dbStoreId) ||
                           storesData.find(s => s.id === localStore?.id) ||
                           storesData[0];

        if (targetStore) {
          setSelectedStore(targetStore);
          await Promise.all([
            loadSalesForStore(targetStore.id),
            loadProductsForStore(targetStore.id)
          ]);
        }

        // Cargar empleados y clientes
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
      throw new Error("Error creando venta");
    }
  };

  const getSaleProducts = async (saleId: string) => {
    try {
      console.log(`Obteniendo productos para venta ${saleId}`);
      
      // Primero intentamos buscar en el estado local
      const localSoldProducts = soldProducts.filter(sp => sp.sale_id === saleId);
      
      // Si no hay productos vendidos en el estado local, los cargamos desde la API
      let saleProductsData = localSoldProducts.length > 0 
        ? localSoldProducts 
        : await SoldProductsService.getSaleProducts(saleId);
      
      console.log(`Productos vendidos encontrados:`, saleProductsData);
      
      if (!saleProductsData.length) return [];
      
      // Obtenemos los IDs de productos únicos
      const productIds = Array.from(new Set(saleProductsData.map(sp => sp.product_id)));
      
      // Primero buscamos en el estado local
      let productsData = products.filter(p => productIds.includes(p.id));
      
      // Si faltan productos, los cargamos desde la API
      if (productsData.length < productIds.length) {
        const missingProductIds = productIds.filter(id => !productsData.find(p => p.id === id));
        const additionalProducts = await ProductsService.getProductsByIds(missingProductIds);
        productsData = [...productsData, ...additionalProducts];
      }
      
      console.log(`Productos encontrados:`, productsData);
      
      // Verificar si hay productos vendidos con precio 0 y corregirlos
      saleProductsData = saleProductsData.map(soldProduct => {
        // Si el precio es 0 o undefined, intentamos obtenerlo del producto
        if (!soldProduct.price) {
          const product = productsData.find(p => p.id === soldProduct.product_id);
          if (product && product.price) {
            console.log(`Corrigiendo precio para producto ${soldProduct.product_id}: ${product.price}`);
            return { ...soldProduct, price: product.price };
          }
        }
        return soldProduct;
      });
      
      // Combinamos los datos de productos vendidos con sus detalles
      return saleProductsData.map(soldProduct => {
        const product = productsData.find(p => p.id === soldProduct.product_id);
        return {
          soldProduct,
          product: product || {
            id: soldProduct.product_id,
            name: "Producto no encontrado",
            description: "",
            price: 0,
            stock: 0,
            store_id: selectedStore.id
          }
        };
      });
    } catch (error) {
      console.error("Error obteniendo productos de la venta:", error);
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