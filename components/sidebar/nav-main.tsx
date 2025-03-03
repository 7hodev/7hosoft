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
        name: "Home",
        icon: Home,
        href: "/dashboard",
        active: pathname === "/dashboard" || pathname.startsWith("/dashboard"),
      },
      {
        name: "Sales",
        icon: Wallet,
        href: "/sales",
        active: pathname === "/sales" || pathname.startsWith("/sales/"),
      },
      {
        name: "Team Chat",
        icon: MessageSquare,
        href: "/chat",
        active: pathname === "/chat" || pathname.startsWith("/chat/"),
      },
      {
        name: "Inventory",
        icon: Box,
        href: "/inventory",
        active: pathname === "/inventory" || pathname.startsWith("/inventory/"),
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
