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
      href: "/",
      active: pathname === "/",
    },
    {
      name: "Sales",
      icon: Wallet,
      href: "/sales",
      active: pathname === "/sales",
    },
    {
      name: "Team Chat",
      icon: MessageSquare,
      href: "/chat",
      active: pathname === "/chat",
    },
    {
      name: "Inventory",
      icon: Box,
      href: "/inventory",
      active: pathname === "/inventory",
    },
    {
      name: "Personal",
      icon: User,
      href: "/personal",
      active: pathname === "/personal",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t sm:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <Button
            key={item.name}
            asChild
            variant="ghost"
            className={cn(
              "h-full flex-col gap-1 rounded-none px-2 hover:bg-transparent",
              item.active && "text-primary"
            )}
          >
            <Link href={item.href}>
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  );
}