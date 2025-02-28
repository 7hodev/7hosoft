import { createClient } from "@/utils/supabase/client";

export const StoresService = {
  getUserStores: async (userId: string) => {
    const { data, error } = await createClient()
      .from('stores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  createStore: async (storeData: { name: string; user_id: string }) => {
    const { data, error } = await createClient()
      .from('stores')
      .insert(storeData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
};