import { signOutAction } from "@/app/actions";
import React from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const LogoutButton: React.FC = () => {
  return (
    <div className="flex" onClick={signOutAction}>
      <LogOut />
      Log Out
    </div>
  );
};

export default LogoutButton;
