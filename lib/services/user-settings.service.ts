import { createClient } from "@/utils/supabase/client";

export const UserSettingsService = {
  getLastStore: async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("last_store")
      .eq("user_id", userId)
      .single();

    if (error?.code === "PGRST116") return null; // No encontrado
    if (error) throw new Error(error.message);
    
    return data?.last_store || null;
  },

  updateLastStore: async (userId: string, storeId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("user_settings")
      .upsert({ 
        user_id: userId, 
        last_store: storeId 
      }, {
        onConflict: "user_id"
      });

    if (error) throw new Error(error.message);
    return true;
  }
};