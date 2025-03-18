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
      iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      href: "/dashboard",
      active: pathname === "/dashboard" || pathname.startsWith("/dashboard"),
    },
    {
      name: "Transactions",
      icon: Wallet,
      iconPath: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
      href: "/transactions",
      active: pathname === "/transactions" || pathname.startsWith("/transactions/"),
    },
    {
      name: "Chat",
      icon: MessageSquare,
      iconPath: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z",
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
    <nav className="fixed bottom-0 left-0 right-0 border-t md:hidden bg-background z-50">
      <div className="h-16 grid grid-cols-5">
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