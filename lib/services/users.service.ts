import { createClient } from "@/utils/supabase/client";

export const UsersService = {
  getCurrentUser: async () => {
    const { data: { user }, error } = await createClient().auth.getUser();
    if (error) throw new Error(error.message);
    return user;
  }
};