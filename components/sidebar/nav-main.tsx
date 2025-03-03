"use client";

import Link from "next/link";
import { Calendar, Home, Inbox, LucideIcon, Search, Settings } from "lucide-react";
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

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon; // Puede ser undefined
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {

  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  const handleMobileClose = () => {
    if (isMobile && openMobile) {
      setOpenMobile(false); // Cierra solo en mobile si está abierto
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Application</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
              >
                <Link
                  href={item.url}
                  onClick={handleMobileClose}
                >
                  {item.icon && <item.icon className="mr-2" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
