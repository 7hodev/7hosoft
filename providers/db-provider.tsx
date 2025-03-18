// app/context/db-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { TransactionsService, TransactionStatus, StatusDisplayInfo, TransactionType, TransactionCategory } from "@/lib/services/transactions.service";
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
  transactions: any[];
  customers: any[];
  employees: any[];
  products: Product[];
  soldProducts: SoldProduct[];
  selectedStore: any;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  setSelectedStore: (store: any) => Promise<void>;
  createTransaction: (transactionData: any) => Promise<any>;
  updateTransaction: (transactionId: string, updatedData: any) => Promise<any>;
  getStatusDisplay: (status: TransactionStatus) => StatusDisplayInfo;
  getTransactionProducts: (transactionId: string) => Promise<{ product: Product; soldProduct: SoldProduct }[]>;
};

const DbContext = createContext<AppData>({
  user: null,
  stores: [],
  transactions: [],
  customers: [],
  employees: [],
  products: [],
  soldProducts: [],
  selectedStore: null,
  loading: true,
  error: null,
  refreshData: async () => {},
  setSelectedStore: async () => {},
  createTransaction: async () => {},
  updateTransaction: async () => {},
  getStatusDisplay: () => ({ text: "", className: "" }),
  getTransactionProducts: async () => [],
});

export function DbProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
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

  const loadTransactionsForStore = async (storeId: string) => {
    try {
      console.log("Iniciando carga de transacciones para tienda:", storeId);
      const transactionsData = await TransactionsService.getStoreTransactions(storeId);
      console.log("Transacciones recibidas de la BD:", transactionsData.length);
      
      // Verificar que todas las transacciones se están cargando correctamente
      if (transactionsData.length > 0) {
        console.log("Primera transacción:", transactionsData[0].id);
        console.log("Última transacción:", transactionsData[transactionsData.length - 1].id);
      }
      
      setTransactions(transactionsData);
      
      const transactionIds = transactionsData.map((transaction: any) => transaction.id);
      const soldProductsData = await SoldProductsService.getTransactionsProducts(transactionIds);
      setSoldProducts(soldProductsData);
    } catch (err) {
      console.error("Error cargando transacciones:", err);
      setError("Error cargando transacciones");
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
            loadTransactionsForStore(targetStore.id),
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

  const getTransactionProducts = async (transactionId: string) => {
    try {
      return await TransactionsService.getTransactionProducts(transactionId);
    } catch (error) {
      console.error("Error obteniendo productos:", error);
      return [];
    }
  };

  const handleCreateTransaction = async (transactionData: any) => {
    try {
      console.log("Creando transacción en DbProvider:", transactionData);
      const newTransaction = await TransactionsService.createTransaction(transactionData);
      console.log("Transacción creada con éxito:", newTransaction);
      
      // Refrescar transacciones y productos después de crear una transacción
      if (selectedStore?.id) {
        console.log("Actualizando datos después de crear transacción...");
        await Promise.all([
          loadTransactionsForStore(selectedStore.id), 
          loadProductsForStore(selectedStore.id)
        ]);
        console.log("Datos actualizados correctamente");
      } else {
        console.warn("No hay tienda seleccionada para refrescar datos");
      }
      
      return newTransaction;
    } catch (error) {
      console.error("Error en DbProvider al crear transacción:", error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Error desconocido al crear la transacción");
      }
    }
  };

  const handleUpdateTransaction = async (transactionId: string, updatedData: any) => {
    try {
      const result = await TransactionsService.updateTransaction(transactionId, updatedData);
      await loadTransactionsForStore(selectedStore.id);
      return result;
    } catch (error) {
      console.error("Error en DbProvider al actualizar transacción:", error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Error desconocido al actualizar la transacción");
      }
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedStore?.id) {
      Promise.all([
        loadTransactionsForStore(selectedStore.id),
        loadProductsForStore(selectedStore.id)
      ]);
    }
  }, [selectedStore?.id]);

  return (
    <DbContext.Provider
      value={{
        user,
        stores,
        transactions,
        customers,
        employees,
        products,
        soldProducts,
        selectedStore,
        loading,
        error,
        refreshData: loadAllData,
        setSelectedStore: persistStoreSelection,
        createTransaction: handleCreateTransaction,
        updateTransaction: handleUpdateTransaction,
        getStatusDisplay: TransactionsService.getStatusDisplay,
        getTransactionProducts
      }}
    >
      {children}
    </DbContext.Provider>
  );
}

export const useDb = () => useContext(DbContext);
