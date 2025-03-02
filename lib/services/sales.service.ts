import { createClient } from "@/utils/supabase/client";

export const SalesService = {
  getStoreSales: async (storeId: string) => {
    const { data, error } = await createClient()
      .from("sales")
      .select("*")
      .eq("store_id", storeId)
      .order("sale_date", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }
};