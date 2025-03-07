import { createClient } from "@/utils/supabase/client";

export interface SoldProduct {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export const SoldProductsService = {
  getSaleProducts: async (saleId: string) => {
    const { data, error } = await createClient()
      .from("sold_products")
      .select("*")
      .eq("sale_id", saleId);

    if (error) throw new Error(error.message);
    return data || [];
  },

  getSalesProducts: async (saleIds: string[]) => {
    if (!saleIds.length) return [];
    
    const { data, error } = await createClient()
      .from("sold_products")
      .select("*")
      .in("sale_id", saleIds);

    if (error) throw new Error(error.message);
    return data || [];
  },

  addProductToSale: async (saleId: string, productId: string, quantity: number) => {
    const { data, error } = await createClient()
      .from("sold_products")
      .insert({
        sale_id: saleId,
        product_id: productId,
        quantity: quantity
        // El precio se copia automáticamente por el trigger de PostgreSQL
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
};
