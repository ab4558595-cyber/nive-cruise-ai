// Storage that never throws.
//
// Inside a cross-origin iframe (or with third-party storage blocked / Safari
// private mode), touching window.localStorage throws a SecurityError and can
// take the whole render down. These wrappers degrade to an in-memory map so
// embedded copies of the app keep working.

const memory = new Map<string, string>();

function backing(kind: "local" | "session"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const s = kind === "local" ? window.localStorage : window.sessionStorage;
    const probe = "__nive_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

function make(kind: "local" | "session") {
  const prefix = `${kind}:`;
  return {
    getItem(key: string): string | null {
      const s = backing(kind);
      if (s) {
        try {
          return s.getItem(key);
        } catch {
          /* fall through to memory */
        }
      }
      return memory.has(prefix + key) ? memory.get(prefix + key)! : null;
    },
    setItem(key: string, value: string): void {
      memory.set(prefix + key, value);
      const s = backing(kind);
      if (!s) return;
      try {
        s.setItem(key, value);
      } catch {
        /* quota or blocked */
      }
    },
    removeItem(key: string): void {
      memory.delete(prefix + key);
      const s = backing(kind);
      if (!s) return;
      try {
        s.removeItem(key);
      } catch {
        /* blocked */
      }
    },
  };
}

export const safeStorage = make("local");
export const safeSessionStorage = make("session");

/** True when the app is rendered inside an iframe. */
export function isEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
