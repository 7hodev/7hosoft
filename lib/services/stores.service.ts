import { createClient } from "@/utils/supabase/client";

export const StoresService = {
  getUserStores: async (userId: string) => {
    const { data, error } = await createClient()
      .from("stores")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  createStore: async (name: string, userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stores")
      .insert([{ name, user_id: userId }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
};