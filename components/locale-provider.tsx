"use client";

import { NextIntlClientProvider } from "next-intl";
import { ReactNode } from "react";
import { useEffect, useState } from "react";

export default function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") || "en";
    setLocale(savedLocale);
  }, []);

  const [messages, setMessages] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    import(`@/locales/${locale}.json`).then(setMessages);
  }, [locale]);

  if (!messages) return null;

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}
