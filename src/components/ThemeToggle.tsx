import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { mode, cycle } = useTheme();
  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  const label = `Theme: ${mode}`;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycle}
      className="text-muted-foreground hover:text-foreground"
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
