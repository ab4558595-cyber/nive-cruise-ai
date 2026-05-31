import { useMemo, useState } from "react";
import { Plus, Pin, PinOff, Trash2, Pencil, Check, X, Search, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Conversation } from "@/lib/chatStore";

export function ConversationsSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onTogglePin,
  onDelete,
  collapsed,
  onCollapse,
}: {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  collapsed: boolean;
  onCollapse: () => void;
}) {
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = conversations;
    if (needle) {
      list = list.filter((c) => {
        if (c.title.toLowerCase().includes(needle)) return true;
        return c.messages.some((m) => m.content.toLowerCase().includes(needle));
      });
    }
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [conversations, q]);

  if (collapsed) {
    return (
      <aside className="hidden w-12 shrink-0 flex-col items-center gap-2 border-r border-border/60 bg-card/40 py-3 md:flex">
        <button
          onClick={onCollapse}
          aria-label="Open chats"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
        <button
          onClick={onNew}
          aria-label="New chat"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-card/40 md:flex">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md text-primary-foreground"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Chats</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCollapse}
          className="ml-auto h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          aria-label="Collapse sidebar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-2 pt-2">
        <Button
          onClick={onNew}
          size="sm"
          className="w-full justify-start gap-2 text-primary-foreground"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Plus className="h-4 w-4" /> New chat
        </Button>
      </div>

      <div className="relative px-2 pb-2 pt-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search chats…"
          className="w-full rounded-md border border-border/60 bg-background/60 py-1.5 pl-7 pr-2 text-xs outline-none focus:border-primary/50"
        />
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-1.5 pb-2">
        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">No matches</div>
        )}
        {filtered.map((c) => {
          const isActive = c.id === activeId;
          const isEditing = c.id === editingId;
          return (
            <div
              key={c.id}
              onClick={() => !isEditing && onSelect(c.id)}
              className={`group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
                isActive ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-muted"
              }`}
            >
              {c.pinned ? (
                <Pin className="h-3 w-3 shrink-0 text-primary" />
              ) : (
                <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
              )}
              {isEditing ? (
                <>
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { onRename(c.id, draft); setEditingId(null); }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 rounded border border-border/60 bg-background px-1 py-0.5 text-xs outline-none"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); onRename(c.id, draft); setEditingId(null); }}
                    aria-label="Save"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate">{c.title || "New chat"}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onTogglePin(c.id); }}
                    title={c.pinned ? "Unpin" : "Pin"}
                    className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                  >
                    {c.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setDraft(c.title); }}
                    title="Rename"
                    className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this chat?")) onDelete(c.id);
                    }}
                    title="Delete"
                    className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-border/60 px-3 py-2 text-[10px] text-muted-foreground">
        {conversations.length} chat{conversations.length === 1 ? "" : "s"} · ⌘K for commands
      </div>
    </aside>
  );
}
