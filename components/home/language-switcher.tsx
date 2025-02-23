"use client";

import { Check, Globe } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Language } from "@/lib/i18n/translations";

interface LanguageSwitcherProps {
  language: Language;
  onChange: (language: Language) => void;
}

export function LanguageSwitcher({ language, onChange }: LanguageSwitcherProps) {
  const handleLanguageChange = useCallback(
    (newLanguage: Language) => {
      onChange(newLanguage);
    },
    [onChange]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleLanguageChange("es")}>
          <span>Español</span>
          {language === "es" && <Check className="ml-2 h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange("en")}>
          <span>English</span>
          {language === "en" && <Check className="ml-2 h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

