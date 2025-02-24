import { signOutAction } from "@/app/actions";
import React from 'react';
import { Button } from "@/components/ui/button";

const LogoutButton: React.FC = () => {

  return (
    <Button asChild onClick={signOutAction}>LogOut</Button>
  );
};

export default LogoutButton;
