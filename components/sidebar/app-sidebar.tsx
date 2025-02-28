"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings,
  Settings2,
  SquareTerminal,
  Building2,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavProjects } from "@/components/sidebar/nav-projects";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar";
import { ButtonConfig } from "@/components/config/button-config";

// This is sample data.
export const data = {
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Sales",
      url: "/sales",
      icon: Bot,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: BookOpen,
    },
    {
      title: "Personal",
      url: "/personal",
      icon: Settings2,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          asChild
          className="flex h-8 w-max items-center justify-center rounded-md py-2 text-sm font-medium hover:bg-transparent disabled:pointer-events-none "
        >
          <div className="flex items-center gap-2">
            <Building2 className="" />
            <span className="">7hoSoft</span>
          </div>
        </SidebarMenuButton>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <ButtonConfig />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
