// Multi-conversation store backed by localStorage.
// One source of truth for the chat sidebar.

import { useEffect, useState, useCallback } from "react";
import type { Msg } from "@/components/ChatMessage";

export type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  messages: Msg[];
};

type Store = {
  conversations: Conversation[];
  activeId: string;
};

const KEY = "cruise-ai-chats-v2";
const LEGACY_KEY = "cruise-ai-conversation-v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function newConvo(messages: Msg[] = []): Conversation {
  return {
    id: uid(),
    title: "New chat",
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages,
  };
}

function load(): Store {
  if (typeof window === "undefined") {
    const c = newConvo();
    return { conversations: [c], activeId: c.id };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Store;
      if (parsed.conversations?.length) return parsed;
    }
    // migrate the old single conversation if present
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const msgs = JSON.parse(legacy) as Msg[];
      const c = newConvo(Array.isArray(msgs) ? msgs : []);
      if (c.messages.length) c.title = deriveTitle(c.messages);
      return { conversations: [c], activeId: c.id };
    }
  } catch {
    /* corrupt — reset */
  }
  const c = newConvo();
  return { conversations: [c], activeId: c.id };
}

function save(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* quota */
  }
}

export function deriveTitle(messages: Msg[]): string {
  const first = messages.find((m) => m.role === "user")?.content?.trim() || "";
  if (!first) return "New chat";
  const oneLine = first.replace(/\s+/g, " ");
  return oneLine.length > 48 ? oneLine.slice(0, 48) + "…" : oneLine;
}

export function useChatStore() {
  const [store, setStore] = useState<Store>(() => load());

  useEffect(() => save(store), [store]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try {
          setStore(JSON.parse(e.newValue));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const active =
    store.conversations.find((c) => c.id === store.activeId) ?? store.conversations[0];

  const newChat = useCallback(() => {
    const c = newConvo();
    setStore((s) => ({ conversations: [c, ...s.conversations], activeId: c.id }));
    return c.id;
  }, []);

  const select = useCallback((id: string) => {
    setStore((s) => ({ ...s, activeId: id }));
  }, []);

  const remove = useCallback((id: string) => {
    setStore((s) => {
      const remaining = s.conversations.filter((c) => c.id !== id);
      const next = remaining.length ? remaining : [newConvo()];
      const activeId = s.activeId === id ? next[0].id : s.activeId;
      return { conversations: next, activeId };
    });
  }, []);

  const rename = useCallback((id: string, title: string) => {
    setStore((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, title: title.trim() || c.title, updatedAt: Date.now() } : c,
      ),
    }));
  }, []);

  const togglePin = useCallback((id: string) => {
    setStore((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, pinned: !c.pinned } : c,
      ),
    }));
  }, []);

  const setActiveMessages = useCallback(
    (updater: (prev: Msg[]) => Msg[]) => {
      setStore((s) => {
        const cur = s.conversations.find((c) => c.id === s.activeId);
        if (!cur) return s;
        const next = updater(cur.messages);
        const wasUntitled = cur.title === "New chat" || !cur.title;
        return {
          ...s,
          conversations: s.conversations.map((c) =>
            c.id === s.activeId
              ? {
                  ...c,
                  messages: next,
                  updatedAt: Date.now(),
                  title: wasUntitled && next.length ? deriveTitle(next) : c.title,
                }
              : c,
          ),
        };
      });
    },
    [],
  );

  const clearActive = useCallback(() => {
    setStore((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === s.activeId
          ? { ...c, messages: [], title: "New chat", updatedAt: Date.now() }
          : c,
      ),
    }));
  }, []);

  return {
    conversations: store.conversations,
    active,
    newChat,
    select,
    remove,
    rename,
    togglePin,
    setActiveMessages,
    clearActive,
  };
}
