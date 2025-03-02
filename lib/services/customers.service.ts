import { createClient } from "@/utils/supabase/client";

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

      // 2. Obtener clientes de las ventas relacionadas
      const storeIds = stores.map(store => store.id);
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("customer_id")
        .in("store_id", storeIds);

      if (salesError) throw salesError;
      if (!sales?.length) return [];

      // Paso 3: Obtener clientes únicos
      const customerIds = Array.from(new Set(sales.map(sale => sale.customer_id)));
      const { data: customers, error: customerError } = await supabase
        .from("customers")
        .select("id, name")
        .in("id", customerIds)
        .order("name", { ascending: true });

      if (customerError) throw customerError;
      return customers || [];

    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error obteniendo clientes"
      );
    }
  }
};