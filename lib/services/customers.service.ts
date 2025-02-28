import { createClient } from "@/utils/supabase/client";

export const CustomersService = {
  getStoreCustomers: async (storeId: string) => {
    const { data, error } = await createClient()
      .from('customers')
      .select('id, name')
      .eq('store_id', storeId);

    if (error) throw new Error(error.message);
    return data;
  }
};