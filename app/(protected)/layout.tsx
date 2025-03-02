"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import * as React from "react";
import ThemeToggle from "@/components/theme-toggle";
import LocaleProvider from "@/components/locale-provider";
import LanguageToggle from "@/components/language-toggle";
import { usePathname } from "next/navigation";
import { CurrentStoreName } from "@/components/store/current-store-name";
import { DbProvider } from "@/providers/db-provider";

export default function Layout({ children }: { children: React.ReactNode }) {

  const pageNames: Record<string, string> = {
      "/": "Inicio",
      "/dashboard": "Dashboard",
      "/sales": "Sales",
      "/inventory": "Inventory",
      "/personal": "Personal",
    };
  
    const pathname = usePathname(); // Obtiene la URL actual
    const pageTitle = pageNames[pathname] || "Página Desconocida";
  
    // This is sample data.
    const data = {
      user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
        plan: "Free",
      },
    };

  return (
    <DbProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 w-full flex flex-col gap-12">
          <SidebarInset>
            <header className="flex h-16 shrink-0 justify-between items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink >
                      <CurrentStoreName />
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="flex items-center gap-2 px-4">
                <div></div>
                <div className="">
                  <ThemeToggle />
                </div>
                <NavUser />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-5">{children}</div>
          </SidebarInset>
        </main>
      </SidebarProvider>
    </DbProvider>
  );
}
