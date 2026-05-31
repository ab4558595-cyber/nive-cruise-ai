// Server-validated system-prompt presets the user can pick from the composer.
// Keep IDs in sync with supabase/functions/ai-code/index.ts.

import { Code2, Bug, GraduationCap, Wrench, Sparkles, FileText, Languages } from "lucide-react";

export type Preset = {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const PRESETS: Preset[] = [
  { id: "default",    label: "Default",         hint: "Balanced engineering tone",            icon: Sparkles },
  { id: "concise",    label: "Concise",         hint: "Just code + 2-line summary",           icon: FileText },
  { id: "teacher",    label: "Teacher",         hint: "Explain step-by-step like a tutor",    icon: GraduationCap },
  { id: "debug",      label: "Debug helper",    hint: "Find the bug + suggest a fix",         icon: Bug },
  { id: "refactor",   label: "Refactor",        hint: "Improve structure, naming, types",     icon: Wrench },
  { id: "review",     label: "Code review",     hint: "Critique like a senior reviewer",      icon: Code2 },
  { id: "translate",  label: "Port language",   hint: "Rewrite in another language",          icon: Languages },
];
