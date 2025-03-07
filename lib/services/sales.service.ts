import { createClient } from "@/utils/supabase/client";

export type SaleStatus = "pending" | "completed" | "canceled";

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
          sale_date: new Date().toISOString(),
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

  updateSale: async (saleId: string, updatedData: {
    customer_id?: string;
    employee_id?: string;
    sale_date?: string;
    status?: SaleStatus;
    total_amount?: number;
    products?: { id: string; quantity: number }[];
  }) => {
    const supabase = createClient();
    
    try {
      // 1. Actualizar venta principal
      const updateFields: any = {};
      
      if (updatedData.customer_id) updateFields.customer_id = updatedData.customer_id;
      if (updatedData.employee_id) updateFields.employee_id = updatedData.employee_id;
      if (updatedData.sale_date) updateFields.sale_date = updatedData.sale_date;
      if (updatedData.status) updateFields.status = updatedData.status;
      if (updatedData.total_amount) updateFields.total_amount = updatedData.total_amount;
      
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .update(updateFields)
        .eq("id", saleId)
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Actualizar productos vendidos si se proporcionaron
      if (updatedData.products && updatedData.products.length > 0) {
        // Primero obtener los productos vendidos actuales para comparar y actualizar stock
        const { data: currentSoldProducts, error: getSoldProductsError } = await supabase
          .from("sold_products")
          .select("*")
          .eq("sale_id", saleId);

        if (getSoldProductsError) throw getSoldProductsError;

        // Eliminar los productos vendidos actuales
        const { error: deleteSoldProductsError } = await supabase
          .from("sold_products")
          .delete()
          .eq("sale_id", saleId);

        if (deleteSoldProductsError) throw deleteSoldProductsError;

        // Crear nuevos registros para productos vendidos
        const newSoldProducts = updatedData.products.map(product => ({
          sale_id: saleId,
          product_id: product.id,
          quantity: product.quantity
        }));

        const { error: insertSoldProductsError } = await supabase
          .from("sold_products")
          .insert(newSoldProducts);

        if (insertSoldProductsError) throw insertSoldProductsError;

        // Actualizar inventario para cada producto
        // Primero devolvemos el stock de los productos anteriores
        for (const oldProduct of currentSoldProducts || []) {
          const { data: productData, error: productError } = await supabase
            .from("products")
            .select("stock")
            .eq("id", oldProduct.product_id)
            .single();
            
          if (productError) continue;
          
          // Devolver el stock al inventario
          const restoredStock = productData.stock + oldProduct.quantity;
          
          await supabase
            .from("products")
            .update({ stock: restoredStock })
            .eq("id", oldProduct.product_id);
        }
        
        // Luego restamos el stock de los nuevos productos
        for (const newProduct of updatedData.products) {
          const { data: productData, error: productError } = await supabase
            .from("products")
            .select("stock")
            .eq("id", newProduct.id)
            .single();
            
          if (productError) continue;
          
          // Restar el stock
          const newStock = Math.max(0, productData.stock - newProduct.quantity);
          
          await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", newProduct.id);
        }
      }

      return sale;
    } catch (error) {
      console.error("Error al actualizar venta:", error);
      
      let errorMessage = "Error desconocido al actualizar la venta";
      
      if (typeof error === "object" && error !== null) {
        const supabaseError = error as any;
        if (supabaseError.message) errorMessage = supabaseError.message;
        if (supabaseError.details) errorMessage += ` - ${supabaseError.details}`;
      }
      
      throw new Error(errorMessage);
    }
  },
  
  getSaleProducts: async (saleId: string) => {
    const supabase = createClient();
    
    try {
      // 1. Obtener productos vendidos
      const { data: soldProducts, error: soldProductsError } = await supabase
        .from("sold_products")
        .select("*")
        .eq("sale_id", saleId);
        
      if (soldProductsError) throw soldProductsError;
      
      if (!soldProducts || soldProducts.length === 0) {
        return [];
      }
      
      // 2. Obtener detalles de productos
      const productIds = soldProducts.map(sp => sp.product_id);
      
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);
        
      if (productsError) throw productsError;
      
      // 3. Combinar datos
      return soldProducts.map(soldProduct => {
        const product = products.find(p => p.id === soldProduct.product_id) || {
          id: soldProduct.product_id,
          name: "Producto no encontrado",
          price: 0,
          stock: 0
        };
        
        return {
          soldProduct,
          product
        };
      });
    } catch (error) {
      console.error("Error obteniendo productos de la venta:", error);
      return [];
    }
  },

  // Status
  getStatusDisplay: (status: SaleStatus): StatusDisplayInfo => {
    const statusMap: Record<SaleStatus, StatusDisplayInfo> = {
      pending: { text: "Pendiente", className: "bg-yellow-500" },
      completed: { text: "Completada", className: "bg-green-600" },
      canceled: { text: "Cancelada", className: "bg-red-600" }
    };
    return statusMap[status];
  },
};
