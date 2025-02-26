"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Flag from "react-world-flags";

export default function LanguageToggle() {
  const router = useRouter();
  const [locale, setLocale] = useState("en");

  // Leer idioma guardado en localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") || "en";
    setLocale(savedLocale);
  }, []);

  const toggleLanguage = () => {
    const newLocale = locale === "en" ? "es" : "en";
    setLocale(newLocale);
    localStorage.setItem("locale", newLocale); // Guardar selección en localStorage
    router.refresh(); // Recargar la página para aplicar el cambio
  };

  return (
    <Button onClick={toggleLanguage} variant="outline">
      {locale === "en" ? "🇪🇸 Español" : "🇺🇸 English"}
    </Button>
  );
}
