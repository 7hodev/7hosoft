// services/users.service.ts
import { createClient } from "@/utils/supabase/client";

export const UsersService = {
  getCurrentUser: async () => {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw new Error(error.message);
    if (!user) return null;

    // Extraer datos de la autenticación integrada
    return {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.display_name || 
                   user.user_metadata?.name || 
                   user.email?.split("@")[0] || 
                   "Usuario",
      metadata: {
        avatar_url: user.user_metadata?.avatar_url || 
                   user.user_metadata?.picture || 
                   ""
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
        avatar_url: updates.avatar_url
      }
    });

    if (error) throw new Error(error.message);
    return {
      id: data.user.id,
      email: data.user.email,
      display_name: data.user.user_metadata?.full_name || data.user.email,
      metadata: {
        avatar_url: data.user.user_metadata?.avatar_url
      }
    };
  }
};

// Tipo TypeScript
export type AppUser = ReturnType<typeof UsersService.getCurrentUser> extends Promise<infer T> ? T : never;