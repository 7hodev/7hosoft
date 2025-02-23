"use client";

import { createContext, useState } from "react";
import { SiteHeader } from "@/components/home/site-header";
import { type Language, translations } from "@/lib/i18n/translations";

export const LanguageContext = createContext({
  language: "en",
  setLanguage: (language: Language) => {},
  t: translations["en"],
});

interface ClientProviderProps {
  children: React.ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
  const [language, setLanguage] = useState<Language>("en");
  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className="flex min-h-screen flex-col">
        {children}
      </div>
    </LanguageContext.Provider>
  );
}