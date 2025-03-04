"use client";

import * as React from "react";
import {
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          asChild
          className="flex h-8 w-max items-center justify-center rounded-md py-2 text-sm font-medium hover:bg-transparent disabled:pointer-events-none "
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 shrink-0" />
            <span className="font-bold text-xl group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">
              <span className="text-primary">7ho</span>
              <span>Soft</span>
            </span>
          </div>
        </SidebarMenuButton>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        {/*
          <NavProjects projects={data.projects} />
         */}
      </SidebarContent>
      <SidebarFooter className="overflow-hidden">
        <ButtonConfig initialSection="account" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );

}
