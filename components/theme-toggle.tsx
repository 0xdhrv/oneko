"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="group pointer-events-auto relative border-border bg-background/80 shadow-xs backdrop-blur-sm"
          aria-label="Theme"
        >
          {mounted ? (
            <>
              <Sun
                size={16}
                weight="duotone"
                className="scale-100 rotate-0 text-foreground transition-transform duration-200 dark:scale-0 dark:-rotate-90"
              />
              <Moon
                size={16}
                weight="duotone"
                className="absolute scale-0 rotate-90 text-foreground transition-transform duration-200 dark:scale-100 dark:rotate-0"
              />
            </>
          ) : (
            <Sun size={16} weight="duotone" className="text-foreground opacity-60" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
