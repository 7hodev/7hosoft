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
import { useSidebar } from "@/components/ui/sidebar";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import { BottomNav } from "@/components/sidebar/nav-responsive";

function AppContent({ children }: { children: React.ReactNode }) {
  const { isMobile } = useSidebar();

  const pageNames: Record<string, string> = {
    "/": "Inicio",
    "/dashboard": "Dashboard",
    "/sales": "Sales",
    "/inventory": "Inventory",
    "/personal": "Personal",
  };

  const pathname = usePathname();
  const pageTitle = pageNames[pathname] || "Página Desconocida";

  const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
      plan: "Free",
    },
  };

  return (
    <>
      <AppSidebar className="m-0 p-0" />
      <main className="flex-1 w-full flex flex-col gap-0 m-0 p-0">
        <SidebarInset className="m-0 p-0">
          <header className="bg-orange-500 flex h-12 md:h-16 shrink-0 justify-between items-center transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 mt-0">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="hidden md:flex mx-auto items-center justify-center" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="">
                    <BreadcrumbLink>
                      <div className="md:hidden">
                        <TeamSwitcher />
                      </div>
                      <div className="hidden md:block">
                        <CurrentStoreName />
                      </div>
                    </BreadcrumbLink>
                  </BreadcrumbItem>

                  <BreadcrumbSeparator className="hidden md:block" />

                  {!isMobile &&
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbPage>
                        {pageTitle}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  }
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
          <div className="flex flex-1 flex-col gap-2 p-2 md:p-5">{children}</div>
        </SidebarInset>
      </main>
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <DbProvider>
      <SidebarProvider>
        <AppContent>{children}</AppContent>
        <BottomNav />
      </SidebarProvider>
    </DbProvider>
  );
}
