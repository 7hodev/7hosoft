"use client";

import { Button } from "@/components/ui/button";
import {
  Home,
  Wallet,
  MessageSquare,
  Box,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
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
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <Button
            key={item.name}
            asChild
            variant="ghost"
            className={cn(
              "h-full flex-col gap-1 rounded-none px-2 hover:bg-transparent",
              item.active ? "text-primary border-t-4 border-primary" : "text-muted-foreground"
            )}
          >
            <Link href={item.href}>
              {item.active ? (
                <item.icon className="h-6 w-6 text-primary dark:text-primary fill-primary dark:fill-primary" />
              ) : (
                <item.icon className="h-6 w-6 text-muted-foreground dark:text-muted-foreground" />
              )}
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  );
}