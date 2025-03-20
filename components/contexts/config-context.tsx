import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useDb } from "@/providers/db-provider";
import { UserSettingsService, PersonType } from "@/lib/services/user_settings.service";

export interface UserSettings {
  user_id: string;
  last_store: number | null;
  person_type: PersonType;
  created_at?: string;
  updated_at?: string;
}

interface ConfigContextType {
  userSettings: UserSettings | null;
  refresh: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType>({
  userSettings: null,
  refresh: async () => {}
});

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useDb();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  const loadUserSettings = async () => {
    if (!user?.id) return;
    
    try {
      const settings = await UserSettingsService.getUserSettings(user.id);
      if (settings) {
        console.log("Config context recibió settings:", settings);
        setUserSettings(settings as UserSettings);
      }
    } catch (error) {
      console.error("Error cargando configuración del usuario:", error);
    }
  };

  useEffect(() => {
    loadUserSettings();
  }, [user?.id]);

  const refresh = async () => {
    await loadUserSettings();
  };

  return (
    <ConfigContext.Provider value={{ userSettings, refresh }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfigContext = () => useContext(ConfigContext); 