import { createClient } from "@/utils/supabase/client";
import { TransactionsService } from "./transactions.service";

// Definir la interfaz Customer con todos los campos de la tabla
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  district?: string;
  sub_district?: string;
  neighborhood?: string;
  state?: string;
  country?: string;
  gender?: string;
  age?: number;
  status?: string;
  total_spent?: number;
  registered_at?: string;
  last_interaction_at?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string; // Nueva columna para vincular directamente con el usuario
}

export const CustomersService = {
  getAllCustomers: async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Método para obtener un cliente específico por ID
  getCustomer: async (customerId: string): Promise<Customer> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (error) throw new Error(error.message);
    return data as Customer;
  },

  // Método para actualizar el gasto total de un cliente
  updateCustomerTotalSpent: async (customerId: string, totalSpent: number) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("customers")
      .update({ 
        total_spent: totalSpent,
        last_interaction_at: TransactionsService.getCurrentLocalTimestamp()
      })
      .eq("id", customerId);

    if (error) throw new Error(error.message);
    return true;
  },

  // Método para calcular el gasto total de un cliente a partir de sus transacciones
  calculateCustomerTotalSpent: async (customerId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("transactions")
      .select("total_amount")
      .eq("customer_id", customerId)
      .eq("type", "income") // Solo considerar transacciones de ingreso
      .eq("status", "completed"); // Solo considerar transacciones completadas

    if (error) throw new Error(error.message);
    
    let totalSpent = 0;
    if (data && data.length > 0) {
      totalSpent = data.reduce((sum, transaction) => sum + Number(transaction.total_amount || 0), 0);
      
      // Actualizar el total gastado en la tabla de clientes
      await CustomersService.updateCustomerTotalSpent(customerId, totalSpent);
    }
    
    return totalSpent;
  },

  // Método para asociar un cliente existente con un usuario
  associateCustomerWithUser: async (customerId: string, userId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("customers")
      .update({ user_id: userId })
      .eq("id", customerId);

    if (error) throw new Error(error.message);
    return true;
  },

  getUserCustomers: async (userId: string) => {
    const supabase = createClient();

    try {
      // Intentar obtener clientes directamente por user_id si la columna existe
      const { data: directCustomers, error: directError } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (!directError && directCustomers && directCustomers.length > 0) {
        console.log(`Encontrados ${directCustomers.length} clientes directamente vinculados al usuario ${userId}`);
        return directCustomers;
      }

      // Si no hay clientes directamente vinculados o hay un error (posiblemente porque la columna no existe),
      // continuamos con el método anterior
      console.log("Buscando clientes por relación a través de transacciones...");
      
      // 1. Obtener tiendas del usuario
      const { data: stores, error: storeError } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", userId);

      if (storeError) throw storeError;
      if (!stores?.length) return [];

      // 2. Obtener clientes de las transacciones relacionadas
      const storeIds = stores.map(store => store.id);
      const { data: transactionsWithCustomers, error: transactionsError } = await supabase
        .from("transactions")
        .select("customer_id")
        .in("store_id", storeIds)
        .not("customer_id", "is", null);

      if (transactionsError) throw transactionsError;
      if (!transactionsWithCustomers?.length) return [];

      // 3. Obtener clientes únicos
      const customerIds = Array.from(
        new Set(
          transactionsWithCustomers
            .map(transaction => transaction.customer_id)
            .filter(Boolean)
        )
      );

      if (customerIds.length === 0) return [];

      // 4. Obtener todos los datos de los clientes
      const { data: customers, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .in("id", customerIds)
        .order("name", { ascending: true });

      if (customerError) throw customerError;
      
      // 5. Opcional: Asociar estos clientes con el usuario para futuras consultas
      for (const customer of customers || []) {
        try {
          await CustomersService.associateCustomerWithUser(customer.id, userId);
        } catch (error) {
          console.warn(`No se pudo asociar el cliente ${customer.id} con el usuario ${userId}`, error);
        }
      }
      
      return customers || [];
    } catch (error) {
      console.error("Error obteniendo clientes:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error obteniendo clientes"
      );
    }
  },

  // Nuevo método para obtener todos los clientes asociados a un usuario,
  // no solo los que tienen transacciones
  getAllUserCustomers: async (userId: string) => {
    const supabase = createClient();

    try {
      // Intentar obtener clientes directamente por user_id si la columna existe
      const { data: directCustomers, error: directError } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (!directError && directCustomers && directCustomers.length > 0) {
        console.log(`Encontrados ${directCustomers.length} clientes directamente vinculados al usuario ${userId}`);
        
        // Actualizar datos de gasto total y última interacción
        await updateCustomersSpendingData(directCustomers, userId);
        
        return directCustomers;
      }

      // Si no hay clientes directamente vinculados, continuamos con el método anterior
      console.log("Buscando clientes por relación a través de transacciones...");
      
      // 1. Obtener tiendas del usuario
      const { data: stores, error: storeError } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", userId);

      if (storeError) throw storeError;
      if (!stores?.length) return [];

      // 2. Obtener transacciones de las tiendas del usuario
      const storeIds = stores.map(store => store.id);
      
      // 3. Obtener clientes a partir de las transacciones
      const { data: transactionsWithCustomers, error: transactionsError } = await supabase
        .from("transactions")
        .select("customer_id, total_amount, sale_date, status, type")
        .in("store_id", storeIds)
        .not("customer_id", "is", null);

      if (transactionsError) throw transactionsError;
      
      // Obtener IDs únicos de clientes
      const uniqueCustomerIds = Array.from(
        new Set(
          (transactionsWithCustomers || [])
            .map(t => t.customer_id)
            .filter(Boolean)
        )
      );

      // 4. Obtener todos los clientes
      const { data: allCustomers, error: allCustomersError } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });

      if (allCustomersError) throw allCustomersError;
      
      // Filtrar clientes que tienen transacciones con las tiendas del usuario
      const userCustomers = (allCustomers || []).filter(customer => 
        uniqueCustomerIds.includes(customer.id)
      );
      
      // Actualizar el gasto total para cada cliente si es necesario
      for (const customer of userCustomers) {
        // Calcular el gasto total basado en las transacciones
        const customerTransactions = transactionsWithCustomers
          ?.filter(t => t.customer_id === customer.id && t.type === 'income' && t.status === 'completed')
          || [];
          
        if (customerTransactions.length > 0) {
          const totalSpent = customerTransactions.reduce(
            (sum, t) => sum + Number(t.total_amount || 0), 
            0
          );
          
          // Actualizar el valor en memoria
          customer.total_spent = totalSpent;
          
          // Encontrar la transacción más reciente
          const sortedTransactions = [...customerTransactions].sort(
            (a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
          );
          
          if (sortedTransactions.length > 0) {
            customer.last_interaction_at = sortedTransactions[0].sale_date;
          }
        }
        
        // Asociar el cliente con el usuario para futuras consultas
        try {
          customer.user_id = userId;
          await CustomersService.associateCustomerWithUser(customer.id, userId);
        } catch (error) {
          console.warn(`No se pudo asociar el cliente ${customer.id} con el usuario ${userId}`, error);
        }
      }
      
      console.log(`Devolviendo ${userCustomers.length} clientes filtrados para el usuario ${userId}`);
      return userCustomers;
    } catch (error) {
      console.error("Error obteniendo todos los clientes:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error obteniendo todos los clientes"
      );
    }
  },

  // Nuevo método para insertar un nuevo cliente
  insertCustomer: async (formData: any, userId: string) => {
    const supabase = createClient();

    try {
      // Insertar el nuevo cliente
      const newCustomerData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        status: formData.status,
        country: formData.country || null,
        state: formData.state || null,
        district: formData.district || null,
        sub_district: formData.sub_district || null,
        neighborhood: formData.neighborhood || null,
        gender: formData.gender || null,
        age: formData.age ? Number(formData.age) : null,
        registered_at: TransactionsService.getCurrentLocalTimestamp(),
        total_spent: 0,
        user_id: userId  // Asociar directamente el cliente con el usuario
      };

      const { data, error } = await supabase
        .from("customers")
        .insert(newCustomerData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Customer;
    } catch (error) {
      console.error("Error insertando cliente:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error insertando cliente"
      );
    }
  }
};

// Función auxiliar para actualizar datos de gasto de los clientes
async function updateCustomersSpendingData(customers: Customer[], userId: string) {
  const supabase = createClient();
  
  try {
    // Obtener tiendas del usuario
    const { data: stores } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", userId);
      
    if (!stores || stores.length === 0) return;
    
    const storeIds = stores.map(store => store.id);
    
    // Obtener todas las transacciones relacionadas con esas tiendas
    const { data: transactions } = await supabase
      .from("transactions")
      .select("customer_id, total_amount, sale_date, status, type")
      .in("store_id", storeIds)
      .eq("type", "income")
      .eq("status", "completed");
      
    if (!transactions || transactions.length === 0) return;
    
    // Actualizar información de cada cliente
    for (const customer of customers) {
      const customerTransactions = transactions.filter(t => t.customer_id === customer.id);
      
      if (customerTransactions.length > 0) {
        // Calcular gasto total
        const totalSpent = customerTransactions.reduce(
          (sum, t) => sum + Number(t.total_amount || 0), 
          0
        );
        
        // Actualizar el cliente en memoria
        customer.total_spent = totalSpent;
        
        // Encontrar la última transacción
        const sortedTransactions = [...customerTransactions].sort(
          (a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
        );
        
        if (sortedTransactions.length > 0) {
          customer.last_interaction_at = sortedTransactions[0].sale_date;
        }
      }
    }
  } catch (error) {
    console.error("Error actualizando datos de gasto de clientes:", error);
  }
}