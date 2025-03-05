import { createClient } from "@/utils/supabase/client";

export type SaleStatus = "pending" | "completed" | "cancelled";

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

  createSale: async (saleData: {
    store_id: string;
    customer_id: string;
    employee_id: string;
    sale_date: string;
    status: SaleStatus;
    total_amount: number;
    products: { id: string; quantity: number }[];
  }) => {
    const supabase = createClient();
    
    try {
      // 1. Insertar venta principal
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          store_id: saleData.store_id,
          customer_id: saleData.customer_id,
          employee_id: saleData.employee_id,
          sale_date: saleData.sale_date,
          status: saleData.status,
          total_amount: saleData.total_amount
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Preparar productos vendidos (sin incluir el precio, que se maneja por un trigger de PostgreSQL)
      const soldProducts = saleData.products.map(product => ({
        sale_id: sale.id,
        product_id: product.id,
        quantity: product.quantity
      }));

      // 3. Insertar productos vendidos
      const { error: soldProductsError } = await supabase
        .from("sold_products")
        .insert(soldProducts);

      if (soldProductsError) {
        console.error("Error al insertar productos vendidos:", soldProductsError);
        throw soldProductsError;
      }

      // 4. Actualizar el stock de cada producto vendido
      for (const product of saleData.products) {
        // Primero obtenemos el stock actual del producto
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("stock")
          .eq("id", product.id)
          .single();
          
        if (productError) {
          console.error(`Error al obtener stock del producto ${product.id}:`, productError);
          continue; // Continuamos con el siguiente producto
        }
        
        // Calculamos el nuevo stock
        const newStock = Math.max(0, productData.stock - product.quantity);
        
        // Actualizamos el stock del producto
        const { error: updateError } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", product.id);
          
        if (updateError) {
          console.error(`Error al actualizar stock del producto ${product.id}:`, updateError);
        }
      }

      return sale;
    } catch (error) {
      console.error("Error al crear venta:", error);
      
      let errorMessage = "Error desconocido al crear la venta";
      
      if (typeof error === "object" && error !== null) {
        const supabaseError = error as any;
        if (supabaseError.message) errorMessage = supabaseError.message;
        if (supabaseError.details) errorMessage += ` - ${supabaseError.details}`;
      }
      
      throw new Error(errorMessage);
    }
  },

  // Status
  getStatusDisplay: (status: SaleStatus): StatusDisplayInfo => {
    const statusMap: Record<SaleStatus, StatusDisplayInfo> = {
      pending: { text: "Pendiente", className: "bg-yellow-500" },
      completed: { text: "Completada", className: "bg-green-600" },
      cancelled: { text: "Cancelada", className: "bg-red-600" }
    };
    return statusMap[status];
  },
};