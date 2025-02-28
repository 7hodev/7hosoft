import { createClient } from "@/utils/supabase/client";

export const SalesService = {
  getStoreSales: async (storeId: string) => {
    const { data, error } = await createClient()
      .from('sales')
      .select(`
        id,
        total_amount,
        sale_date,
        customer_id,
        employee_id,
        store_id
      `)
      .eq('store_id', storeId)
      .order('sale_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  createSale: async (saleData: any) => {
    const { data, error } = await createClient()
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
};