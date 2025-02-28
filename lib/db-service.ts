import { createClient } from "@/utils/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";

// Tipos TypeScript para tus tablas
export type AppUser = {
  uid: string;
  email: string;
  phone?: string | null;
  display_name?: string | null;
  metadata?: Record<string, any>;
};

export type Store = {
  id: string;
  name: string;
  location: string | null;
  user_id: string;
};

export type Stock = {
  id: string;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  store_id: string;
};

class DBService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  // ==================== Users ====================
  async getCurrentUser(): Promise<AppUser | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    return user ? this.transformUser(user) : null;
  }

  async updateUserProfile(updates: {
    display_name?: string;
    phone?: string;
  }): Promise<AppUser> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.updateUser({
      data: {
        ...updates,
        // Esto se guarda en user_metadata
      },
    });

    if (error || !user)
      throw new Error(error?.message || "Error actualizando usuario");
    return this.transformUser(user);
  }

  async getUserById(uid: string): Promise<AppUser> {
    const { data, error } = await this.supabase
      .from("users")
      .select("id, email, phone, raw_user_meta_data")
      .eq("id", uid)
      .single();

    if (error) throw new Error(error.message);
    return this.transformUser(data);
  }

  // Método para transformar la respuesta de Supabase
  private transformUser(user: any): AppUser {
    return {
      uid: user.id,
      email: user.email,
      phone: user.phone,
      display_name: user.user_metadata?.display_name || null,
      metadata: user.user_metadata,
    };
  }

  // ==================== Stores ====================
  async getStores(): Promise<Store[]> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    if (!user) throw new Error("Usuario no autenticado");

    const { data, error } = await this.supabase
      .from("stores")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return data as Store[];
  }

  async getStoreById(storeId: string): Promise<Store> {
    const { data, error } = await this.supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single();

    if (error) throw new Error(error.message);
    return data as Store;
  }

  async createStore(storeData: Omit<Store, "id">): Promise<Store> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    if (!user) throw new Error("Usuario no autenticado");

    const { data, error } = await this.supabase
      .from("stores")
      .insert([{ ...storeData, user_id: user.id }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Store;
  }

  // ==================== Stocks ====================
  async getStocks(storeId: string): Promise<Stock[]> {
    const { data, error } = await this.supabase
      .from("stocks")
      .select("*")
      .eq("store_id", storeId);

    if (error) throw new Error(error.message);
    return data as Stock[];
  }

  async getStockById(stockId: string): Promise<Stock> {
    const { data, error } = await this.supabase
      .from("stocks")
      .select("*")
      .eq("id", stockId)
      .single();

    if (error) throw new Error(error.message);
    return data as Stock;
  }

  async createStock(stockData: Omit<Stock, "id">): Promise<Stock> {
    const { data, error } = await this.supabase
      .from("stocks")
      .insert([stockData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Stock;
  }

  async updateStock(
    stockId: string,
    updateData: Partial<Stock>
  ): Promise<Stock> {
    const { data, error } = await this.supabase
      .from("stocks")
      .update(updateData)
      .eq("id", stockId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Stock;
  }

  async deleteStock(stockId: string): Promise<void> {
    const { error } = await this.supabase
      .from("stocks")
      .delete()
      .eq("id", stockId);

    if (error) throw new Error(error.message);
  }
}

export const dbService = new DBService();
