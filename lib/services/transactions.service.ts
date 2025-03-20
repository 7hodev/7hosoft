import { createClient } from "@/utils/supabase/client";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export type TransactionStatus = "pending" | "completed" | "canceled" | "refunded";
export type TransactionType = "income" | "expense";

export type TransactionCategory = 
  // Para tipo income
  | "sales"
  | "services"
  | "investment_returns"
  | "interest_income"
  | "rental_income"
  | "refunds_received"
  | "other_income"
  // Para tipo expense
  | "cost_of_goods_sold"
  | "salaries_wages"
  | "rent"
  | "utilities"
  | "office_supplies"
  | "marketing"
  | "travel"
  | "insurance"
  | "professional_services"
  | "equipment"
  | "maintenance"
  | "taxes"
  | "refunds_issued"
  | "other_expenses";

// Definir la interfaz Transaction para usar en toda la aplicación
export interface Transaction {
  id: string;
  store_id: string;
  customer_id?: string | null;
  employee_id?: string | null;
  recipient?: string | null;
  sale_date: string;
  status: TransactionStatus;
  total_amount: number;
  description?: string | null;
  payment_method?: string;
  deductible?: boolean;
  type: TransactionType;
  category: TransactionCategory;
  created_at?: string;
  updated_at?: string;
}

export interface StatusDisplayInfo {
  text: string;
  className: string;
}

export const TransactionsService = {
  getStoreTransactions: async (storeId: string) => {
    console.log("Solicitando transacciones para tienda:", storeId);
    
    const { data, error } = await createClient()
      .from("transactions")
      .select("*")
      .eq("store_id", storeId)
      .order("id", { ascending: false });

    if (error) {
      console.error("Error en consulta de transacciones:", error);
      throw new Error(error.message);
    }
    
    console.log("Total de transacciones recuperadas:", data?.length || 0);
    return data || [];
  },

  createTransaction: async (transactionData: {
    store_id: string;
    customer_id: string;
    employee_id: string;
    recipient?: string;
    sale_date: string;
    status: TransactionStatus;
    total_amount: number;
    description?: string;
    payment_method?: string;
    deductible?: boolean;
    type: TransactionType;
    category: TransactionCategory;
    products?: { id: string; quantity: number }[];
  }) => {
    const supabase = createClient();
    
    try {
      console.log("Iniciando creación de transacción:", {
        type: transactionData.type,
        category: transactionData.category,
        hasProducts: transactionData.products && transactionData.products.length > 0,
      });

      // Usar el método estandarizado para obtener la fecha actual
      // Si se proporciona una fecha, la usamos tal cual, de lo contrario usamos la fecha actual local
      const dateToUse = transactionData.sale_date || TransactionsService.getCurrentLocalTimestamp();
      
      console.log("Fecha utilizada para la transacción:", dateToUse);

      // Asegurar que recipient siempre esté definido para gastos
      if (transactionData.type === 'expense' && !transactionData.recipient) {
        console.log("Estableciendo recipient por defecto para transacción de tipo gasto");
        transactionData.recipient = "Sin destinatario";
      }
      
      console.log("RECIPIENT FINAL PARA BASE DE DATOS:", transactionData.recipient);

      // 1. Crear transacción de manera simple y directa
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          store_id: transactionData.store_id,
          customer_id: transactionData.customer_id,
          employee_id: transactionData.employee_id,
          recipient: transactionData.recipient,
          sale_date: dateToUse,
          status: transactionData.status,
          total_amount: transactionData.total_amount,
          description: transactionData.description || null,
          payment_method: transactionData.payment_method || 'cash',
          deductible: transactionData.deductible || false,
          type: transactionData.type,
          category: transactionData.category,
        })
        .select()
        .single();

      if (transactionError) {
        console.error("Error al insertar transacción principal:", transactionError);
        throw transactionError;
      }

      console.log("Transacción creada con ID:", transaction.id);

      // 2. Si es una transacción de ingreso con productos, los procesamos
      if (transactionData.products && transactionData.products.length > 0) {
        console.log(`Procesando ${transactionData.products.length} productos para transacción:`, transaction.id);
        
        // Preparar productos vendidos
        const soldProducts = transactionData.products.map(product => ({
          transaction_id: transaction.id,
          product_id: product.id,
          quantity: product.quantity
        }));

        // Insertar productos vendidos
        const { error: soldProductsError } = await supabase
          .from("sold_products")
          .insert(soldProducts);

        if (soldProductsError) {
          console.error("Error al insertar productos vendidos:", soldProductsError);
          throw soldProductsError;
        }

        console.log("Productos insertados correctamente");

        // Actualizar el stock de cada producto vendido
        for (const product of transactionData.products) {
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
      }

      console.log("Transacción completada con éxito");
      return transaction;
    } catch (error) {
      console.error("Error al crear transacción:", error);
      
      let errorMessage = "Error desconocido al crear la transacción";
      
      if (typeof error === "object" && error !== null) {
        const supabaseError = error as any;
        if (supabaseError.message) errorMessage = supabaseError.message;
        if (supabaseError.details) errorMessage += ` - ${supabaseError.details}`;
      }
      
      throw new Error(errorMessage);
    }
  },

  updateTransaction: async (
    transactionId: string,
    updatedData: {
      customer_id?: string;
      employee_id?: string;
      recipient?: string;
      sale_date?: string;
      status?: TransactionStatus;
      total_amount?: number;
      description?: string;
      payment_method?: string;
      deductible?: boolean;
      type?: TransactionType;
      category?: TransactionCategory;
      products?: { id: string; quantity: number }[];
    }
  ) => {
    const supabase = createClient();
    
    const { products, ...transactionFields } = updatedData;

    try {
      // Procesar la fecha si está presente
      if (transactionFields.sale_date) {
        // Aseguramos que la fecha tenga formato completo
        if (!transactionFields.sale_date.includes('T')) {
          // Si solo tiene fecha sin hora, añadimos la hora actual
          const now = new Date();
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const seconds = String(now.getSeconds()).padStart(2, '0');
          transactionFields.sale_date = `${transactionFields.sale_date}T${hours}:${minutes}:${seconds}Z`;
        }
      } else {
        // Si no hay fecha, usar la fecha actual local
        transactionFields.sale_date = TransactionsService.getCurrentLocalTimestamp();
      }

      // Actualizar la transacción principal
      const { error: updateError } = await supabase
        .from("transactions")
        .update(transactionFields)
        .eq("id", transactionId);

      if (updateError) throw new Error(updateError.message);

      // Si hay productos para actualizar, manejarlos independientemente del tipo
      // Para asegurar que funciona aún si type no está definido en updatedData
      if (products && products.length > 0) {
        console.log("Actualizando productos para la transacción:", transactionId);
        console.log("Productos a insertar:", products);
        
        // 1. Eliminar todos los productos vendidos de esta transacción
        const { error: deleteError } = await supabase
          .from("sold_products")
          .delete()
          .eq("transaction_id", transactionId);

        if (deleteError) {
          console.error("Error eliminando productos antiguos:", deleteError);
          throw new Error(deleteError.message);
        }

        // 2. Insertar los productos actualizados
        const soldProductsToInsert = products.map(product => ({
          transaction_id: transactionId,
          product_id: product.id,
          quantity: product.quantity
        }));

        const { error: insertError } = await supabase
          .from("sold_products")
          .insert(soldProductsToInsert);

        if (insertError) {
          console.error("Error insertando nuevos productos:", insertError);
          throw new Error(insertError.message);
        }
        
        console.log("Productos actualizados con éxito");
      }

      return {
        success: true,
        message: "Transacción actualizada con éxito",
      };
    } catch (error) {
      console.error("Error actualizando transacción:", error);
      throw error;
    }
  },

  // Método para obtener una transacción específica por ID
  getTransaction: async (transactionId: string): Promise<Transaction> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (error) throw new Error(error.message);
    return data as Transaction;
  },

  // Método para eliminar una transacción
  deleteTransaction: async (transactionId: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId);

    if (error) throw new Error(error.message);
  },

  getTransactionProducts: async (transactionId: string) => {
    const supabase = createClient();
    
    try {
      // 1. Obtener productos vendidos
      const { data: soldProducts, error: soldProductsError } = await supabase
        .from("sold_products")
        .select("*")
        .eq("transaction_id", transactionId);
        
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
      console.error("Error obteniendo productos de la transacción:", error);
      return [];
    }
  },

  // Status
  getStatusDisplay: (status: TransactionStatus): StatusDisplayInfo => {
    const statusMap: Record<TransactionStatus, StatusDisplayInfo> = {
      pending: { text: "Pendiente", className: "bg-yellow-500" },
      completed: { text: "Completada", className: "bg-green-600" },
      canceled: { text: "Cancelada", className: "bg-red-600" },
      refunded: { text: "Reembolsada", className: "bg-purple-600" }
    };
    return statusMap[status];
  },

  // Helper para convertir fechas de UTC a la zona horaria local
  convertToLocalDate: (utcDateString: string): Date => {
    if (!utcDateString) return new Date();
    
    try {
      // Parseamos la fecha explícitamente sin ninguna conversión de zona horaria
      const parsedDate = parseISO(utcDateString);
      // Devolvemos la fecha en la zona horaria local
      return parsedDate;
    } catch (error) {
      console.error("Error al convertir fecha:", error);
      return new Date();
    }
  },

  // Helper para formatear fechas en formato local
  formatLocalDate: (utcDateString: string, formatStr: string = "dd/MM/yyyy HH:mm"): string => {
    if (!utcDateString) return "N/A";
    
    try {
      // Parsear la fecha ISO
      const parsedDate = parseISO(utcDateString);
      
      // Formatear la fecha según el formato solicitado
      return format(parsedDate, formatStr);
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "N/A";
    }
  },
  
  // Helper para obtener el timestamp actual en la zona horaria local del usuario
  getCurrentLocalTimestamp: (): string => {
    // Obtenemos la zona horaria del usuario
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Obtenemos la fecha actual
    const now = new Date();
    
    // Formateamos la fecha en ISO pero manteniendo la zona horaria local
    // Esto es crucial para evitar la conversión implícita a UTC que hace toISOString()
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    // Formato: YYYY-MM-DDTHH:mm:ss.sssZ (formato ISO pero preservando hora local)
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
  }
}; 