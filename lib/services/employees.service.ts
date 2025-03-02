import { createClient } from "@/utils/supabase/client";

export const EmployeesService = {
  getAllEmployees: async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  getUserEmployees: async (userId: string) => {
    const supabase = createClient();

    try {
      // 1. Obtener tiendas del usuario
      const { data: stores, error: storeError } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", userId);

      if (storeError) throw storeError;
      if (!stores?.length) return [];

      // 2. Obtener empleados de las ventas relacionadas
      const storeIds = stores.map(store => store.id);
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("employee_id")
        .in("store_id", storeIds);

      if (salesError) throw salesError;
      if (!sales?.length) return [];

      // Paso 3: Obtener empleados únicos
      const employeeIds = Array.from(new Set(sales.map(sale => sale.employee_id)));
      const { data: employees, error: employeeError } = await supabase
        .from("employees")
        .select("id, name")
        .in("id", employeeIds)
        .order("name", { ascending: true });

      if (employeeError) throw employeeError;
      return employees || [];

    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error obteniendo empleados"
      );
    }
  }
};