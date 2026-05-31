import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export type PaletteCommand = {
  id: string;
  label: string;
  hint?: string;
  group?: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  run: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  commands,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  commands: PaletteCommand[];
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const groups = commands.reduce<Record<string, PaletteCommand[]>>((acc, c) => {
    const g = c.group ?? "Actions";
    (acc[g] ||= []).push(c);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {Object.entries(groups).map(([group, items], gi) => (
          <div key={group}>
            {gi > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items.map((c) => {
                const Icon = c.icon;
                return (
                  <CommandItem
                    key={c.id}
                    onSelect={() => {
                      onOpenChange(false);
                      // defer so the dialog can close before navigation
                      setTimeout(c.run, 0);
                    }}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                    <span>{c.label}</span>
                    {c.hint && <span className="ml-2 text-xs text-muted-foreground">{c.hint}</span>}
                    {c.shortcut && (
                      <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {c.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
