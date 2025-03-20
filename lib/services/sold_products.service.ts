import { createClient } from "@/utils/supabase/client";

export interface SoldProduct {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export const SoldProductsService = {
  getTransactionProducts: async (transactionId: string) => {
    console.log(`Obteniendo productos para transacción ID: ${transactionId}`);
    
    try {
      const { data, error } = await createClient()
        .from("sold_products")
        .select("*")
        .eq("transaction_id", transactionId)
        .order("id", { ascending: false });

      if (error) {
        console.error("Error al obtener productos vendidos:", error);
        throw new Error(error.message);
      }
      
      console.log(`Productos encontrados: ${data?.length || 0}`);
      return data || [];
    } catch (error) {
      console.error("Error en getTransactionProducts:", error);
      return [];
    }
  },

  getTransactionsProducts: async (transactionIds: string[]) => {
    if (!transactionIds.length) return [];
    
    console.log(`Obteniendo productos para ${transactionIds.length} transacciones`);
    
    try {
      const { data, error } = await createClient()
        .from("sold_products")
        .select("*")
        .in("transaction_id", transactionIds)
        .order("id", { ascending: false });

      if (error) {
        console.error("Error al obtener productos vendidos para múltiples transacciones:", error);
        throw new Error(error.message);
      }
      
      console.log(`Productos encontrados para múltiples transacciones: ${data?.length || 0}`);
      return data || [];
    } catch (error) {
      console.error("Error en getTransactionsProducts:", error);
      return [];
    }
  },

  addProductToTransaction: async (transactionId: string, productId: string, quantity: number) => {
    console.log(`Agregando producto ${productId} a transacción ${transactionId} (cantidad: ${quantity})`);
    
    try {
      const { data, error } = await createClient()
        .from("sold_products")
        .insert({
          transaction_id: transactionId,
          product_id: productId,
          quantity: quantity
          // El precio se copia automáticamente por el trigger de PostgreSQL
        })
        .select()
        .single();

      if (error) {
        console.error("Error al agregar producto a transacción:", error);
        throw new Error(error.message);
      }
      
      console.log("Producto agregado correctamente a la transacción");
      return data;
    } catch (error) {
      console.error("Error en addProductToTransaction:", error);
      throw error;
    }
  },
};
