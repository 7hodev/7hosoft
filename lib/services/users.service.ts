// services/users.service.ts
import { createClient } from "@/utils/supabase/client";

export const UsersService = {
  getCurrentUser: async () => {
    const supabase = createClient();
    
    // Primero obtenemos la sesión actual para verificar que el usuario está autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) throw new Error(sessionError.message);
    if (!session) return null;
    
    // Luego obtenemos los datos del usuario
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw new Error(error.message);
    if (!user) return null;

    // Determinar la fuente de autenticación (Google u otro proveedor)
    const provider = user.app_metadata?.provider || "email";
    const isOAuthProvider = provider !== "email";
    
    // Manejar diferentes formatos de datos según el proveedor
    let displayName = "";
    let avatarUrl = "";
    
    if (isOAuthProvider) {
      // Para proveedores OAuth (Google, Facebook, etc.)
      displayName = 
        user.user_metadata?.name || 
        user.user_metadata?.full_name || 
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] || 
        "Usuario";
        
      avatarUrl = 
        user.user_metadata?.avatar_url || 
        user.user_metadata?.picture ||
        "";
    } else {
      // Para autenticación por email/password
      displayName = 
        user.user_metadata?.display_name || 
        user.email?.split("@")[0] || 
        "Usuario";
        
      avatarUrl = user.user_metadata?.avatar_url || "";
    }
    
    // Extraer datos de usuario con soporte mejorado para proveedores externos
    return {
      id: user.id,
      email: user.email,
      display_name: displayName,
      metadata: {
        avatar_url: avatarUrl,
        provider: provider
      }
    };
  },

  updateUserProfile: async (updates: {
    display_name?: string;
    avatar_url?: string;
  }) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: updates.display_name,
        display_name: updates.display_name, // Para compatibilidad con ambos formatos
        avatar_url: updates.avatar_url
      }
    });

    if (error) throw new Error(error.message);
    
    // Determinar el provider
    const provider = data.user.app_metadata?.provider || "email";
    
    // Extraer y normalizar datos
    return {
      id: data.user.id,
      email: data.user.email,
      display_name: 
        data.user.user_metadata?.full_name || 
        data.user.user_metadata?.display_name || 
        data.user.email,
      metadata: {
        avatar_url: data.user.user_metadata?.avatar_url,
        provider: provider
      }
    };
  }
};

// Tipo TypeScript
export type AppUser = ReturnType<typeof UsersService.getCurrentUser> extends Promise<infer T> ? T : never;