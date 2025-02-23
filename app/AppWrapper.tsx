"use client";

import { createContext, useState } from "react";
import { Geist } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/home/site-header";
import { type Language, translations } from "@/lib/i18n/translations";
import { ClientProvider } from "./ClientProvider";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";



const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export const LanguageContext = createContext({
  language: "en",
  setLanguage: (language: Language) => {},
  t: translations["en"],
});

export default function AppWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [language, setLanguage] = useState<Language>("en");
  const t = translations[language];

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground flex items-center justify-center min-h-screen">
        <ClientProvider>
          <LanguageContext.Provider value={{ language, setLanguage, t }}>
            <div className="flex min-h-screen flex-col">
              <SiteHeader language={language} onLanguageChange={setLanguage} t={t} />
              {children}
            </div>
          </LanguageContext.Provider>
        </ClientProvider>
      </body>
    </html>
  );
}