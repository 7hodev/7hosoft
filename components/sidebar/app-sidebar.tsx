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
} from "@/components/ui/sidebar";
import { ButtonConfig } from "@/components/config/button-config";

// This is sample data.
export const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
    plan: "Free",
  },
  navMain: [
    {
      title: "Home",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Sales",
      url: "#",
      icon: Bot,
    },
    {
      title: "Inventory",
      url: "#",
      icon: BookOpen,
    },
    {
      title: "Personal",
      url: "/conosywaffles/local1/settings",
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
