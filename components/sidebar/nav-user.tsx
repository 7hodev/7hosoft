"use client";

import * as React from "react";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ButtonConfig } from "../config/button-config";
import { UserProfileBadge } from "../profile/user-profile-badge";
import { signOutAction } from "@/app/actions";
import { SubmitButton } from "../auth/submit-button";
import { useMediaQuery } from "@/hooks/use-media-query";

export function NavUser() {
  const { isMobile } = useSidebar();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [configOpen, setConfigOpen] = React.useState(false);
  const isTabletOrMobile = useMediaQuery("(max-width: 768px)");

  // Función para manejar el clic en el botón de usuario
  const handleUserButtonClick = () => {
    if (isTabletOrMobile) {
      // En móviles y tablets, abrimos directamente la configuración
      setConfigOpen(true);
    } else {
      // En desktop, mantenemos el comportamiento original
      setMenuOpen(!menuOpen);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {isTabletOrMobile ? (
          // En móviles y tablets, usamos ButtonConfig con un trigger personalizado
          <ButtonConfig 
            initialSection="account"
            open={configOpen}
            onOpenChange={setConfigOpen}
            customTrigger={
              <SidebarMenuButton
                size="lg"
                onClick={handleUserButtonClick}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <UserProfileBadge responsive />
              </SidebarMenuButton>
            }
          />
        ) : (
          // En desktop, mantenemos el DropdownMenu original
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <UserProfileBadge />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="top"
              align="end"
              sideOffset={4}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <UserProfileBadge showEmail />
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Actualizar a Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Cuenta
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Facturación
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  Notificaciones
                </DropdownMenuItem>
                <DropdownMenuItem className="p-0" onSelect={(e) => e.preventDefault()}>
                  <ButtonConfig initialSection="account" />
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <form className="w-full">
                  <SubmitButton 
                    className="w-full flex items-center justify-start px-2 py-0 text-xs min-h-0 h-8 bg-transparent text-foreground hover:bg-foreground hover:text-background focus:bg-transparent" 
                    pendingText="LogOut..." 
                    formAction={signOutAction}
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    LogOut
                  </SubmitButton>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}