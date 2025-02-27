"use client"

import { ChevronsUpDown } from "lucide-react"
import { useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useStore } from "@/app/context/store-context"
import { AddStoreDialog } from "@/components/select-store/add-store-dialog"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { selectedStore, setSelectedStore, stores, refreshStores } = useStore()

  // Cargar tiendas al montar el componente
  useEffect(() => {
    refreshStores()
  }, [])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {selectedStore ? (
                <>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <span className="text-sm">{selectedStore.name[0]}</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {selectedStore.name}
                    </span>
                    <span className="truncate text-xs">Tienda</span>
                  </div>
                </>
              ) : (
                <div className="flex-1 text-sm">Seleccionar tienda</div>
              )}
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Tus Tiendas
            </DropdownMenuLabel>

            {stores.map((store) => (
              <DropdownMenuItem
                key={store.id}
                onClick={() => setSelectedStore(store)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <span className="text-xs">{store.name[0]}</span>
                </div>
                {store.name}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <AddStoreDialog />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}