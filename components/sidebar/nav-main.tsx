"use client";

import Link from "next/link";
import {
  Calendar, Home, Inbox, LucideIcon, Search, Settings, Wallet, MessageSquare, Box, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavMain() {

  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  const handleMobileClose = () => {
    if (isMobile && openMobile) {
      setOpenMobile(false); // Cierra solo en mobile si está abierto
    }
  };

  const pathname = usePathname();

  const data = {

    navMain: [
      {
        name: "Inicio",
        icon: Home,
        href: "/dashboard",
        active: pathname === "/dashboard" || pathname.startsWith("/dashboard"),
      },
      {
        name: "Finanzas",
        icon: Wallet,
        href: "/finance",
        active: pathname === "/finance" || pathname.startsWith("/finance/"),
      },
      {
        name: "Inventario",
        icon: Box,
        href: "/inventory",
        active: pathname === "/inventory" || pathname.startsWith("/inventory/"),
      },
      {
        name: "Clientes",
        icon: MessageSquare,
        href: "/customer",
        active: pathname === "/customer" || pathname.startsWith("/customer/"),
      },
      {
        name: "Personal",
        icon: User,
        href: "/personal",
        active: pathname === "/personal" || pathname.startsWith("/personal/"),
      },
    ],
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Application</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {data.navMain.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                className={cn(
                  "",
                  item.active ? "text-white bg-primary dark:bg-foreground/10" : "text-muted-foreground"
                )}
              >
                <Link
                  href={item.href}
                  onClick={handleMobileClose}
                >
                  {item.icon && <item.icon className="mr-2" />}
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
