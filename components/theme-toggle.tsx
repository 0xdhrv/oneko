"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

// No-op subscribe + diverging snapshots: server renders `false`, client resolves
// to `true` in a single hydration commit (no post-mount setState, no icon flash).
const subscribeNoop = () => () => {};
const snapshotClient = () => true;
const snapshotServer = () => false;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeNoop, snapshotClient, snapshotServer);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="group pointer-events-auto relative border-border bg-background/80 shadow-xs backdrop-blur-sm"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      suppressHydrationWarning
      onClick={() => setTheme(isDark ? "light" : "dark")}
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
  );
}
