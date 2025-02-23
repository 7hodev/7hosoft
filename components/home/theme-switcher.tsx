"use client"

import { Moon, Sun } from "lucide-react"
import { useCallback } from "react"

import { Button } from "@/components/ui/button"

interface ThemeSwitcherProps {
  theme: "light" | "dark"
  onChange: (theme: "light" | "dark") => void
}

export function ThemeSwitcher({ theme, onChange }: ThemeSwitcherProps) {
  const toggleTheme = useCallback(() => {
    onChange(theme === "light" ? "dark" : "light")
  }, [theme, onChange])

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:bg-accent hover:text-accent-foreground">
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      <span className="sr-only">{theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}</span>
    </Button>
  )
}

