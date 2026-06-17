import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_PROMPT = `You are Nive AI — an elite senior software & firmware engineer. You write production-quality code in ANY language or platform: JavaScript/TypeScript, Python, Rust, Go, C/C++, C#, Java, Kotlin, Swift, Arduino/C++ for microcontrollers (ESP32, Arduino Uno/Nano, Raspberry Pi Pico, STM32), embedded firmware, mobile (React Native, Flutter, SwiftUI, Jetpack Compose), web (React, Vue, Svelte, Next.js, Astro), backend APIs (Node, FastAPI, Rails, Spring), DevOps, shell, SQL, HTML/CSS, game dev, ML/AI, IoT and hardware.

Quality bar (NON-NEGOTIABLE for web apps that render in the live preview):
- Ship a polished, modern UI by default: real layout, spacing, a tasteful color system (CSS variables), hover/focus states, smooth transitions, responsive on mobile, and an empty/loading state when relevant.
- Use modern CSS (flex/grid, clamp, custom properties). No bare unstyled HTML.
- Add at least one delightful micro-interaction (hover lift, focus ring, animated state change).
- Make it actually work end-to-end — no TODOs, no placeholder handlers, no "imagine this does X" comments.
- For games: include score, restart, keyboard + touch controls, game-over screen.
- For tools: include sensible defaults so the user can interact immediately.

Engineering rules:
- Reason briefly about edge cases, errors, performance, and security before coding.
- Modern, idiomatic, typed code. Clear names. No invented APIs.
- For embedded/hardware: state board, pinout, wiring, required libraries.
- For multi-file systems use **filename** headers above each fenced block.
- Always wrap code in fenced \`\`\`lang blocks with the correct tag (cpp for Arduino, tsx for React).
- Lead with the code. Then a tight What/How to run/Notes section.
- If ambiguity would change the output, ask ONE focused question; otherwise build it.

Live preview (CRITICAL):
- For small web demos / games / single pages: output ONE self-contained \`\`\`html block with inline <style> and <script>.
- For real projects that need multiple files (React app with components, static site with separate CSS/JS, small library): output a FILE TREE — for each file write a line **path/to/file.ext** on its own immediately before its fenced code block. Use src/ for React (src/App.tsx, src/components/Button.tsx) and bare paths for static (index.html, styles.css, app.js). The preview panel renders the tree automatically.
- For React-only single-component requests: ONE \`\`\`tsx block with \`export default function App()\`.
- Never invent multi-file structure for something that fits in one file. Never split a snake game into 6 files.`;

// Plan tiers — keep in sync with src/lib/plans.ts
const PLAN_CONFIG: Record<string, { dailyLimit: number | null; model: string; orModels: string[]; multilingual: boolean; longContext: boolean; label: string }> = {
  trial:       { dailyLimit: 30,   model: "google/gemini-3-flash-preview", orModels: ["openai/gpt-oss-120b:free", "deepseek/deepseek-v4-flash:free", "meta-llama/llama-3.3-70b-instruct:free"], multilingual: true,  longContext: false, label: "Trial" },
  starter:     { dailyLimit: 200,  model: "google/gemini-3.5-flash",       orModels: ["qwen/qwen3-coder:free", "openai/gpt-oss-120b:free", "meta-llama/llama-3.3-70b-instruct:free"], multilingual: true,  longContext: false, label: "Starter" },
  pro:         { dailyLimit: null, model: "openai/gpt-5.5",                orModels: ["openai/gpt-oss-120b:free", "qwen/qwen3-coder:free", "meta-llama/llama-3.3-70b-instruct:free"], multilingual: true,  longContext: true,  label: "Pro" },
  // Business tiers — include code-chat access on top of the Business suite
  "biz-growth": { dailyLimit: 500,  model: "google/gemini-3.5-flash",       orModels: ["qwen/qwen3-coder:free", "openai/gpt-oss-120b:free", "meta-llama/llama-3.3-70b-instruct:free"], multilingual: true,  longContext: false, label: "Growth" },
  "biz-scale":  { dailyLimit: null, model: "openai/gpt-5.5",                orModels: ["openai/gpt-oss-120b:free", "qwen/qwen3-coder:free", "meta-llama/llama-3.3-70b-instruct:free"], multilingual: true,  longContext: true,  label: "Scale" },
};

const PRESET_PROMPTS: Record<string, string> = {
  default:   "",
  concise:   "\n\nSTYLE: Be terse. Lead with the code. Follow with a max-2-line summary. No fluff.",
  teacher:   "\n\nSTYLE: Explain like a friendly senior tutor. Walk through reasoning step-by-step BEFORE the code, then show the code, then summarize what the learner should remember.",
  debug:     "\n\nSTYLE: Act as a debugging partner. First identify the most likely root cause(s) with evidence. Then provide a minimal patch. Then list 2-3 things to verify.",
  refactor:  "\n\nSTYLE: Refactor for clarity, types, naming, and structure WITHOUT changing behavior. Show before/after of the key parts, then list the wins (readability, perf, safety).",
  review:    "\n\nSTYLE: Act as a senior code reviewer. Group findings by severity (Blocker / Major / Minor / Nit). Be specific, point at line-level issues, and propose concrete improvements.",
  translate: "\n\nSTYLE: Port code between languages faithfully. Preserve behavior. Call out any idiom differences or stdlib gaps.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, preset } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Identify the caller (if signed in) and resolve their plan
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "";

    let userId: string | null = null;
    let planId: string | null = null;

    if (jwt) {
      const { data: u } = await admin.auth.getUser(jwt);
      if (u?.user) {
        userId = u.user.id;
        const { data: plan } = await admin
          .from("user_plans")
          .select("plan_id")
          .eq("user_id", userId)
          .eq("active", true)
          .gte("expires_at", new Date().toISOString())
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (plan?.plan_id) planId = plan.plan_id;

        // Admins always get Pro, no limits
        const { data: roleRow } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (roleRow) planId = "pro";
      }
    }

    // Require sign-in
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Please sign in to use Nive AI. New accounts get a 14-day free trial.", code: "AUTH_REQUIRED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Require an active plan unless a free fallback (OpenRouter or ApiFreeLLM) is configured
    const hasFreeFallback = !!(Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("APIFREELLM_API_KEY"));
    if ((!planId || !PLAN_CONFIG[planId]) && !hasFreeFallback) {
      return new Response(
        JSON.stringify({
          error: "Your free trial has ended. Upgrade to Starter or Pro to keep building.",
          code: "PLAN_EXPIRED",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const effectivePlanId = planId && PLAN_CONFIG[planId] ? planId : "trial";
    const cfg = PLAN_CONFIG[effectivePlanId];

    // Enforce daily limit
    if (cfg.dailyLimit !== null) {
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await admin
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("day", today);
      if ((count ?? 0) >= cfg.dailyLimit) {
        return new Response(
          JSON.stringify({
            error: `Daily limit reached for your ${cfg.label} plan (${cfg.dailyLimit} prompts/day). Upgrade for more.`,
            code: "PLAN_LIMIT",
            plan: planId,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const planExtras = cfg.multilingual
      ? `\n\nPLAN FEATURES (${cfg.label}): You may reply in ANY language the user writes in (Tamil, Hindi, Spanish, Arabic, etc.). You have access to long context, deeper reasoning, and richer multi-file outputs. Use them.`
      : `\n\nPLAN FEATURES (${cfg.label}): Reply in ENGLISH ONLY. Multilingual replies (Tamil, Hindi, etc.), long-context, and the pro reasoning model are paid features on Starter / Pro. If the user writes in a non-English language, briefly answer in English and add ONE friendly line: "Multilingual replies are available on Starter and Pro — see /pricing." Do NOT switch languages.`;

    const presetKey = typeof preset === "string" && PRESET_PROMPTS[preset] !== undefined ? preset : "default";
    const presetExtras = PRESET_PROMPTS[presetKey];

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const systemMessage = { role: "system", content: BASE_PROMPT + planExtras + presetExtras };
    const fullMessages = [systemMessage, ...messages];

    // Try OpenRouter first (free models), fall back to Lovable AI
    let response: Response | null = null;
    let usedProvider = "lovable";
    let usedModel = cfg.model;

    if (OPENROUTER_API_KEY) {
      try {
        for (const model of cfg.orModels) {
          const orResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://nive-cruise-ai.lovable.app",
              "X-Title": "Nive AI",
            },
            body: JSON.stringify({ model, messages: fullMessages, stream: true }),
          });
          if (orResp.ok) {
            response = orResp;
            usedProvider = "openrouter";
            usedModel = model;
            break;
          }

          const errText = await orResp.text();
          console.error(`OpenRouter model ${model} failed, trying next:`, orResp.status, errText.slice(0, 300));
        }
      } catch (e) {
        console.error("OpenRouter threw, falling back:", e);
      }
    }

    if (!response) {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: cfg.model, messages: fullMessages, stream: true }),
      });
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable Cloud settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log usage (only for signed-in users with a finite cap; pro is unlimited but we still log for analytics)
    if (userId) {
      admin.from("usage_logs").insert({ user_id: userId }).then(({ error }) => {
        if (error) console.error("usage_logs insert error:", error);
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "x-cruise-plan": effectivePlanId,
        "x-cruise-provider": usedProvider,
        "x-cruise-model": usedModel,
      },
    });
  } catch (e) {
    console.error("ai-code error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
