import { createClient } from "@/utils/supabase/client";

export interface Product {
  quantity: number;
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  store_id: number;
}

export const ProductsService = {
  getStoreProducts: async (storeId: string) => {
    const { data, error } = await createClient()
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  getProductById: async (productId: string) => {
    const { data, error } = await createClient()
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  getProductsByIds: async (productIds: string[]) => {
    if (!productIds.length) return [];
    
    const { data, error } = await createClient()
      .from("products")
      .select("*")
      .in("id", productIds);

    if (error) throw new Error(error.message);
    return data || [];
  }
};