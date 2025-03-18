import { createClient } from "@/utils/supabase/client";

// Definir la interfaz Employee
export interface Employee {
  id: string;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

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

  // Método para obtener un empleado específico por ID
  getEmployee: async (employeeId: string): Promise<Employee> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (error) throw new Error(error.message);
    return data as Employee;
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

      // 2. Obtener empleados de las transacciones relacionadas
      const storeIds = stores.map(store => store.id);
      const { data: transactionsWithEmployees, error: transactionsError } = await supabase
        .from("transactions")
        .select("employee_id")
        .in("store_id", storeIds)
        .not("employee_id", "is", null);

      if (transactionsError) throw transactionsError;
      if (!transactionsWithEmployees?.length) return [];

      // 3. Obtener empleados únicos
      const employeeIds = Array.from(
        new Set(
          transactionsWithEmployees
            .map(transaction => transaction.employee_id)
            .filter(Boolean)
        )
      );

      if (employeeIds.length === 0) return [];

      const { data: employees, error: employeeError } = await supabase
        .from("employees")
        .select("id, name, email, phone, position")
        .in("id", employeeIds)
        .order("name", { ascending: true });

      if (employeeError) throw employeeError;
      return employees || [];
    } catch (error) {
      console.error("Error obteniendo empleados:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error obteniendo empleados"
      );
    }
  }
};