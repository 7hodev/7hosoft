declare module "@/types/supabase" {
    export interface SupabaseError {
      message: string;
      details?: string;
      code?: string;
    }
  }