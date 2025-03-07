"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";

const PasswordInput = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative group">
      <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
      <Input
        id="password"
        type={showPassword ? "text" : "password"}
        name="password"
        placeholder="Contraseña"
        required
        className="border p-2 pl-10 pr-10 w-full rounded"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
};

export default PasswordInput;
