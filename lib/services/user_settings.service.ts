// lib/services/user-settings.service.ts
import { createClient } from "@/utils/supabase/client";

export const UserSettingsService = {
  // Obtener última tienda del usuario
  getLastStore: async (userId: string): Promise<number | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("last_store")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error obteniendo última tienda:", error.message);
      return null;
    }
    return data?.last_store || null;
  },

  // Crear/Actualizar última tienda
  upsertLastStore: async (userId: string, storeId: number) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("user_settings")
      .upsert(
        { 
          user_id: userId, 
          last_store: storeId 
        }, 
        { 
          onConflict: "user_id"  // Solo opciones válidas
        }
      )
      .select();  // <--- Añade esto para obtener la respuesta

    if (error) throw new Error(error.message);
    return true;
  }
};