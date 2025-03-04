import { createClient } from "@/utils/supabase/client";

export type SaleStatus = "pending" | "completed" | "cancelled" | null;

export interface StatusDisplayInfo {
  text: string;
  className: string;
}

export const SalesService = {
  getStoreSales: async (storeId: string) => {
    const { data, error } = await createClient()
      .from("sales")
      .select("*")
      .eq("store_id", storeId)
      .order("sale_date", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  createSale: async (saleData: any) => {
    try {
      const { data, error } = await createClient()
        .from("sales")
        .insert(saleData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error("Error creando venta");
    }
  },

  getStatusDisplay: (status: SaleStatus): StatusDisplayInfo => {
    const statusMap: Record<string, StatusDisplayInfo> = {
      "pending": { text: "Pendiente", className: "text-yellow-600" },
      "completed": { text: "Completada", className: "text-green-600" },
      "cancelled": { text: "Cancelada", className: "text-red-600" }
    };
    
    if (!status) return { text: "Pendiente", className: "text-yellow-600" };
    
    return status in statusMap 
      ? statusMap[status]
      : { text: status, className: "" };
  }
};