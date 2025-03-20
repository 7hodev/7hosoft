// lib/services/user-settings.service.ts
import { createClient } from "@/utils/supabase/client";

export type PersonType = "individual" | "corporate";

export interface UserSettings {
  user_id: string;
  last_store: number | null;
  person_type: PersonType;
  created_at?: string;
  updated_at?: string;
}

export const UserSettingsService = {
  // Obtener configuración completa del usuario
  getUserSettings: async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error obteniendo configuración de usuario:", error.message);
      return null;
    }
    
    // Asegurarse de que person_type sea uno de los valores válidos
    if (data) {
      // Normalizar el person_type para asegurarse de que sea un valor válido
      if (data.person_type) {
        const normalizedType = data.person_type.toLowerCase().trim();
        data.person_type = normalizedType === "corporate" ? "corporate" : "individual";
      } else {
        // Si no hay valor, establecer el valor por defecto
        data.person_type = "individual";
      }
    }
    
    console.log("getUserSettings retorna:", data);
    return data || null;
  },

  // Actualizar configuración completa del usuario
  updateUserSettings: async (settings: UserSettings) => {
    const supabase = createClient();
    
    // Asegurar que person_type sea un valor válido
    if (settings.person_type) {
      settings.person_type = settings.person_type === "corporate" ? "corporate" : "individual";
    }
    
    console.log("Actualizando settings con:", settings);
    
    const { data, error } = await supabase
      .from("user_settings")
      .upsert(
        { 
          ...settings 
        }, 
        { 
          onConflict: "user_id"
        }
      )
      .select();

    if (error) {
      console.error("Error al actualizar configuración:", error.message);
      throw new Error(error.message);
    }
    
    console.log("updateUserSettings retorna:", data);
    return data;
  },

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
  },

  // Obtener el tipo de persona del usuario
  getPersonType: async (userId: string): Promise<PersonType> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("person_type")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error obteniendo tipo de persona:", error.message);
      return "individual"; // Por defecto, persona natural
    }
    
    // Si no hay datos o el person_type no está definido, devolver individual
    if (!data || !data.person_type) return "individual";
    
    // Normalizar el valor para asegurarse de que sea un tipo válido
    const normalizedType = data.person_type.toLowerCase().trim();
    return normalizedType === "corporate" ? "corporate" : "individual";
  },

  // Actualizar el tipo de persona del usuario
  updatePersonType: async (userId: string, personType: PersonType) => {
    const supabase = createClient();
    
    // Asegurarse de que personType sea un valor válido
    const normalizedPersonType: PersonType = personType === "corporate" ? "corporate" : "individual";
    
    console.log(`Actualizando tipo de persona a ${normalizedPersonType} para el usuario ${userId}`);
    
    const { data, error } = await supabase
      .from("user_settings")
      .upsert(
        { 
          user_id: userId, 
          person_type: normalizedPersonType 
        }, 
        { 
          onConflict: "user_id"
        }
      )
      .select();

    if (error) {
      console.error("Error al actualizar tipo de persona:", error.message);
      throw new Error(error.message);
    }
    
    console.log("updatePersonType retorna:", data);
    return data;
  }
};