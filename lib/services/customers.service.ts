import { createClient } from "@/utils/supabase/client";

// Definir la interfaz Customer
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export const CustomersService = {
  getAllCustomers: async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .select("id, name")
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

  getUserCustomers: async (userId: string) => {
    const supabase = createClient();

    try {
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

      const { data: customers, error: customerError } = await supabase
        .from("customers")
        .select("id, name, email, phone, address")
        .in("id", customerIds)
        .order("name", { ascending: true });

      if (customerError) throw customerError;
      return customers || [];
    } catch (error) {
      console.error("Error obteniendo clientes:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error obteniendo clientes"
      );
    }
  }
};