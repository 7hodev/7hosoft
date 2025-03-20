// app/context/db-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { TransactionsService, TransactionStatus, StatusDisplayInfo, TransactionType, TransactionCategory } from "@/lib/services/transactions.service";
import { StoresService } from "@/lib/services/stores.service";
import { UsersService } from "@/lib/services/users.service";
import { CustomersService } from "@/lib/services/customers.service";
import { EmployeesService } from "@/lib/services/employees.service";
import { UserSettingsService, PersonType, UserSettings } from "@/lib/services/user_settings.service";
import { ProductsService, Product } from "@/lib/services/products.service";
import { SoldProductsService, SoldProduct } from "@/lib/services/sold_products.service";

// Extend AppUser to include settings
interface AppUser {
  id: string;
  email?: string;
  display_name: string;
  metadata: {
    avatar_url: string;
    provider: string;
  };
  settings?: UserSettings;
}

type AppData = {
  user: AppUser | null;
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
  updatePersonType: (personType: PersonType) => Promise<any>;
  getUserSettings: () => Promise<any>;
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
  updatePersonType: async () => {},
  getUserSettings: async () => null,
});

export function DbProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<AppUser | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [soldProducts, setSoldProducts] = useState<SoldProduct[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para actualizar el tipo de persona
  const handleUpdatePersonType = async (personType: PersonType) => {
    if (!user) {
      console.error("No hay usuario activo");
      return;
    }

    try {
      const result = await UserSettingsService.updatePersonType(user.id, personType);
      // Actualizar el objeto de usuario con los nuevos settings
      const settings = await UserSettingsService.getUserSettings(user.id);
      
      // Usar una copia del usuario y añadir settings con aserción de tipo
      const updatedUser = { ...user } as AppUser;
      updatedUser.settings = settings as UserSettings;
      setUser(updatedUser);
      
      console.log(`Tipo de persona actualizado a: ${personType}`);
      return result;
    } catch (error) {
      console.error("Error al actualizar tipo de persona:", error);
      throw error;
    }
  };

  // Función para obtener la configuración completa del usuario
  const handleGetUserSettings = async () => {
    if (!user) {
      console.error("No hay usuario activo");
      return null;
    }

    try {
      return await UserSettingsService.getUserSettings(user.id);
    } catch (error) {
      console.error("Error al obtener configuración de usuario:", error);
      return null;
    }
  };

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

      let currentUser = null;
      let retries = 0;
      while (!currentUser && retries < 3) {
        currentUser = await UsersService.getCurrentUser();
        if (!currentUser) {
          retries++;
          if (retries < 3) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      if (currentUser) {
        // Obtener la configuración del usuario
        const settings = await UserSettingsService.getUserSettings(currentUser.id);
        
        // Usar una copia y aserciones de tipo para añadir settings
        const updatedUser = { ...currentUser } as AppUser;
        updatedUser.settings = settings as UserSettings;
        setUser(updatedUser);

        const storesData = await StoresService.getUserStores(currentUser.id);
        setStores(storesData);

        const [dbStoreId, localStore] = await Promise.all([
          UserSettingsService.getLastStore(currentUser.id),
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

        // Cargar clientes directamente asociados con el usuario
        const [customersData, employeesData] = await Promise.all([
          CustomersService.getAllUserCustomers(currentUser.id),
          EmployeesService.getUserEmployees(currentUser.id)
        ]);
        
        console.log("Clientes cargados:", customersData.length);
        setCustomers(customersData);
        setEmployees(employeesData);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
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
      
      // Programar una actualización completa para refrescar tanto las transacciones como los clientes
      await loadAllData();
      
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
      
      // Programar una actualización completa para refrescar tanto las transacciones como los clientes
      await loadAllData();
      
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
      // Use let to set initial state to make sure this runs only once when selectedStore changes
      // and not on every render
      let isMounted = true;
      if (isMounted) {
        Promise.all([
          loadTransactionsForStore(selectedStore.id),
          loadProductsForStore(selectedStore.id)
        ]);
      }
      return () => {
        isMounted = false;
      };
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
        getTransactionProducts,
        updatePersonType: handleUpdatePersonType,
        getUserSettings: handleGetUserSettings
      }}
    >
      {children}
    </DbContext.Provider>
  );
}

export const useDb = () => useContext(DbContext);
