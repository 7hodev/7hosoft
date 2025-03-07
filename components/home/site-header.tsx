"use client";

import Link from "next/link";
import { Building2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { LanguageSwitcher } from "./language-switcher";
import type { Language } from "@/lib/i18n/translations";
import * as React from "react";
import ThemeToggle from "@/components/theme-toggle";

interface SiteHeaderProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  t: any;
}

export function SiteHeader({ language, onLanguageChange, t }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold">7hoSoft</span>
        </Link>
        <NavigationMenu className="hidden lg:flex lg:ml-6">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>{t.nav.features}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {Object.entries(t.features.items).map(
                    ([key, feature]: [string, any]) => (
                      <NavigationMenuLink asChild key={key}>
                        <Link
                          href={`#${key}`}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            {feature.title}
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {feature.description}
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    )
                  )}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="#precios" legacyBehavior passHref>
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                  {t.nav.pricing}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="#contacto" legacyBehavior passHref>
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                  {t.nav.contact}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="flex items-center space-x-4">
            <LanguageSwitcher language={language} onChange={onLanguageChange} />
            <ThemeToggle />
          </div>
          <div className="flex :items-center space-x-4">
            <Button variant="ghost" className="bg-black text-white dark:bg-white dark:text-black lg:bg-white lg:text-black dark:lg:bg-black dark:lg:text-white hover:bg-secondary/90" asChild>
              <Link href="/sign-in">{t.nav.signin}</Link>
            </Button>
            <Button asChild className="hidden lg:block">
              <Link href="/sign-up">{t.nav.signup}</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
