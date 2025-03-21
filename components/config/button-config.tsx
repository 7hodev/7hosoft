"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { useSidebar, SidebarMenuButton } from "@/components/ui/sidebar";
import { Settings, User, Store, ArrowLeft, LogOut, Briefcase } from "lucide-react";
import { AccountConfig } from "@/components/config/config-pages";
import { BusinessConfig } from "@/components/config/business-config";

export function ButtonConfig({ 
  onOpen, 
  initialSection = "account", 
  open, 
  onOpenChange,
  customTrigger 
}: { 
  onOpen?: () => void, 
  initialSection?: string,
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  customTrigger?: React.ReactNode
}) {
  const { state, isMobile, setOpenMobile  } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [selectedSection, setSelectedSection] = React.useState(initialSection);
  const [showContent, setShowContent] = React.useState(false); 
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Usar estado controlado si se proporcionan open y onOpenChange
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = React.useCallback((value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  }, [isControlled, onOpenChange]);

  // Asegurar que selectedSection se actualice si initialSection cambia
  React.useEffect(() => {
    setSelectedSection(initialSection);
  }, [initialSection]);

  const handleOpen = () => {
    onOpen?.();
    // Cerrar sidebar solo en mobile
    if (isMobile) {
      setOpenMobile(false);
      setShowContent(true); 
    }
  };

  const handleMobileSelection = (section: string) => {
    setSelectedSection(section);
    setShowContent(true);
  };

  const handleBack = () => {
    setShowContent(false);
    // No reiniciamos selectedSection para mantener la última selección
  };

  const SettingsSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {!isMobile && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <span className="text-lg font-semibold">Configuration</span>
          </div>
        </div>
      )}

      <div className={cn("flex-1 space-y-1", isMobile ? "pt-2 px-4" : "p-4")}>
        <Button
          variant={selectedSection === "account" ? "secondary" : "ghost"}
          className="w-full justify-start gap-2"
          onClick={() => isMobile ? handleMobileSelection("account") : setSelectedSection("account")}
        >
          <User className="h-4 w-4" />
          Cuenta
        </Button>
        <Button
          variant={selectedSection === "business" ? "secondary" : "ghost"}
          className="w-full justify-start gap-2"
          onClick={() => isMobile ? handleMobileSelection("business") : setSelectedSection("business")}
        >
          <Briefcase className="h-4 w-4" />
          Negocio
        </Button>

        <Separator className="my-4" />
      </div>
    </div>
  );

  const MobileContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {selectedSection === "account" && "Cuenta"}
          {selectedSection === "business" && "Negocio"}
        </h2>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {selectedSection === "account" && <AccountConfig />}
        {selectedSection === "business" && <BusinessConfig />}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setOpen}>
        {customTrigger ? (
          <DialogTrigger asChild>
            {customTrigger}
          </DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <SidebarMenuButton
              className={cn(
                "w-full transition-all",
                isCollapsed ? "justify-center" : "justify-start"
              )}
              onClick={handleOpen}
            >
              <Settings className="h-4 w-4" />
              {!isCollapsed && <span>configuration</span>}
            </SidebarMenuButton>
          </DialogTrigger>
        )}
        <DialogContent className="max-w-4xl h-[80vh] flex p-0">
          <div className="w-[240px] border-r">
            <SettingsSidebar />
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <DialogHeader className="text-left mb-6">
              <DialogTitle className="text-2xl">
                {selectedSection === "account" && "Configuración de Cuenta"}
                {selectedSection === "business" && "Configuración del Negocio"}
              </DialogTitle>
              <DialogDescription className="m-0 p-0">
              </DialogDescription>
            </DialogHeader>
            {selectedSection === "account" ? (
              <AccountConfig />
            ) : selectedSection === "business" ? (
              <BusinessConfig />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setOpen}>
      {customTrigger ? (
        <DrawerTrigger asChild>
          {customTrigger}
        </DrawerTrigger>
      ) : (
        <DrawerTrigger asChild>
          <SidebarMenuButton
            className={cn(
              "w-full transition-all",
              isCollapsed ? "justify-center" : "justify-start"
            )}
            onClick={handleOpen}
          >
            <Settings className="h-4 w-4" />
            {!isCollapsed && <span>configuration</span>}
          </SidebarMenuButton>
        </DrawerTrigger>
      )}
      <DrawerContent className="h-[80vh]">
        {showContent ? (
          <MobileContent />
        ) : (
          <>
            <DrawerHeader>
              <DrawerTitle>Configuration</DrawerTitle>
            </DrawerHeader>
            <SettingsSidebar isMobile />
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Cerrar</Button>
              </DrawerClose>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}