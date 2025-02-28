"use client";

import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions";
import React from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const LogoutButton: React.FC = () => {

  const router = useRouter();

  const handleLogout = async () => {
    await signOutAction();
    router.push("/sign-in"); // Redirige instantáneamente en el cliente
  };

  return (
    <div className="flex cursor-pointer" onClick={handleLogout}>
      Log Out
    </div>
  );
};

export default LogoutButton;
