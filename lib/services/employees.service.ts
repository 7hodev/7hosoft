import { createClient } from "@/utils/supabase/client";

export const EmployeesService = {
  getStoreEmployees: async (storeId: string) => {
    const { data, error } = await createClient()
      .from('employees')
      .select('id, full_name')
      .eq('store_id', storeId);

    if (error) throw new Error(error.message);
    return data;
  }
};