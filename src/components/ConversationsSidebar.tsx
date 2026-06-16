import { useMemo, useState } from "react";
import {
  Pin, PinOff, Trash2, Pencil, Check,
  Search, MessageSquare, Library, PanelLeft, SquarePen,
} from "lucide-react";
import type { Conversation } from "@/lib/chatStore";

/** 4-color Gemini-style sparkle */
function NiveSparkle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nive-spark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="33%" stopColor="#34A853" />
          <stop offset="66%" stopColor="#FBBC04" />
          <stop offset="100%" stopColor="#EA4335" />
        </linearGradient>
      </defs>
      <path
        d="M12 2 L13.6 8.4 C 13.9 9.6 14.4 10.1 15.6 10.4 L 22 12 L 15.6 13.6 C 14.4 13.9 13.9 14.4 13.6 15.6 L 12 22 L 10.4 15.6 C 10.1 14.4 9.6 13.9 8.4 13.6 L 2 12 L 8.4 10.4 C 9.6 10.1 10.1 9.6 10.4 8.4 Z"
        fill="url(#nive-spark)"
      />
    </svg>
  );
}

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
  const [searching, setSearching] = useState(false);
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
      <aside className="hidden w-[56px] shrink-0 flex-col items-center gap-1 border-r border-[#ececec] bg-white py-3 md:flex">
        <button
          onClick={onCollapse}
          aria-label="Open chats"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4]"
        >
          <PanelLeft className="h-[18px] w-[18px]" />
        </button>
        <button
          onClick={onNew}
          aria-label="New chat"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#1f1f1f] transition-colors hover:bg-[#f1f3f4]"
        >
          <SquarePen className="h-[18px] w-[18px]" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="hidden w-[260px] shrink-0 flex-col border-r border-[#ececec] bg-white md:flex"
      style={{ fontFamily: "'Google Sans', 'Product Sans', Inter, system-ui, sans-serif" }}
    >
      {/* Brand row */}
      <div className="flex items-center gap-2 px-4 py-3">
        <NiveSparkle className="h-6 w-6" />
        <span className="text-[20px] font-medium tracking-tight text-[#1f1f1f]">Nive</span>
        <button
          onClick={onCollapse}
          aria-label="Collapse sidebar"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
        >
          <PanelLeft className="h-[18px] w-[18px]" />
        </button>
      </div>

      {/* Primary nav items — pill style */}
      <nav className="px-2 pt-1">
        <button
          onClick={onNew}
          className="flex w-full items-center gap-3 rounded-full bg-[#e8efff] px-4 py-2.5 text-[14px] font-medium text-[#1f1f1f] transition-colors hover:bg-[#dde7ff]"
        >
          <SquarePen className="h-[18px] w-[18px]" />
          <span>New chat</span>
        </button>

        {searching ? (
          <div className="mt-1 flex items-center gap-3 rounded-full bg-[#f1f3f4] px-4 py-2">
            <Search className="h-[18px] w-[18px] text-[#5f6368]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => { if (!q) setSearching(false); }}
              placeholder="Search chats"
              className="flex-1 bg-transparent text-[14px] text-[#1f1f1f] outline-none placeholder:text-[#5f6368]"
            />
          </div>
        ) : (
          <button
            onClick={() => setSearching(true)}
            className="mt-1 flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-[14px] text-[#1f1f1f] transition-colors hover:bg-[#f1f3f4]"
          >
            <Search className="h-[18px] w-[18px] text-[#1f1f1f]" />
            <span>Search chats</span>
          </button>
        )}

        <button
          className="mt-1 flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-[14px] text-[#1f1f1f] transition-colors hover:bg-[#f1f3f4]"
        >
          <Library className="h-[18px] w-[18px] text-[#1f1f1f]" />
          <span>Library</span>
        </button>
      </nav>

      {/* Recent section */}
      <div className="mt-4 px-4 pb-1 text-[12px] font-medium text-[#5f6368]">Recent</div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 && (
          <div className="px-3 py-4 text-[12px] text-[#5f6368]">No chats yet</div>
        )}
        {filtered.map((c) => {
          const isActive = c.id === activeId;
          const isEditing = c.id === editingId;
          return (
            <div
              key={c.id}
              onClick={() => !isEditing && onSelect(c.id)}
              className={`group flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-[13px] transition-colors ${
                isActive ? "bg-[#e8efff] text-[#1f1f1f]" : "text-[#1f1f1f] hover:bg-[#f1f3f4]"
              }`}
            >
              {c.pinned ? (
                <Pin className="h-3.5 w-3.5 shrink-0 text-[#1a73e8]" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-[#5f6368]" />
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
                    className="flex-1 rounded border border-[#dadce0] bg-white px-1.5 py-0.5 text-[12px] outline-none"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); onRename(c.id, draft); setEditingId(null); }}
                    aria-label="Save"
                    className="text-[#5f6368] hover:text-[#1f1f1f]"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate">{c.title || "New chat"}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onTogglePin(c.id); }}
                    title={c.pinned ? "Unpin" : "Pin"}
                    className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#1a73e8]"
                  >
                    {c.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setDraft(c.title); }}
                    title="Rename"
                    className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#1a73e8]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this chat?")) onDelete(c.id);
                    }}
                    title="Delete"
                    className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#d93025]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Notebooks section (visual parity with Gemini) */}
      <div className="border-t border-[#ececec] px-2 py-2">
        <div className="px-2 pb-1 pt-1 text-[12px] font-medium text-[#5f6368]">Notebooks</div>
        <button
          onClick={onNew}
          className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-[14px] text-[#1f1f1f] transition-colors hover:bg-[#f1f3f4]"
        >
          <Plus className="h-[18px] w-[18px] text-[#1f1f1f]" />
          <span>New notebook</span>
        </button>
      </div>
    </aside>
  );
}
