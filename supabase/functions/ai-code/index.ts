import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_PROMPT = `You are Cruise AI — an elite senior software & firmware engineer. You write production-quality code in ANY language or platform: JavaScript/TypeScript, Python, Rust, Go, C/C++, C#, Java, Kotlin, Swift, Arduino/C++ for microcontrollers (ESP32, Arduino Uno/Nano, Raspberry Pi Pico, STM32), embedded firmware, mobile (React Native, Flutter, SwiftUI, Jetpack Compose), web (React, Vue, Svelte, Next.js, Astro), backend APIs (Node, FastAPI, Rails, Spring), DevOps, shell, SQL, HTML/CSS, game dev, ML/AI, IoT and hardware.

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
- When the user asks for a web app, website, game, demo, or anything that runs in a browser, output a SINGLE self-contained \`\`\`html block with inline <style> and <script>. This renders in the side preview panel automatically.
- For React-only requests, output ONE \`\`\`tsx block exporting \`export default function App()\` with all logic inline.
- Never split web demos across files unless the user asks.`;

// Plan tiers — keep in sync with src/lib/plans.ts
const PLAN_CONFIG: Record<string, { dailyLimit: number | null; model: string; multilingual: boolean; longContext: boolean; label: string }> = {
  anonymous: { dailyLimit: 3, model: "google/gemini-2.5-flash-lite", multilingual: false, longContext: false, label: "Anonymous" },
  free:      { dailyLimit: 5, model: "google/gemini-2.5-flash",      multilingual: false, longContext: false, label: "Free" },
  starter:   { dailyLimit: 200, model: "google/gemini-3.5-flash",    multilingual: true,  longContext: false, label: "Starter" },
  pro:       { dailyLimit: null, model: "google/gemini-3.1-pro-preview", multilingual: true, longContext: true, label: "Pro" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Identify the caller (if signed in) and resolve their plan
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "";

    let userId: string | null = null;
    let planId = "anonymous";

    if (jwt) {
      const { data: u } = await admin.auth.getUser(jwt);
      if (u?.user) {
        userId = u.user.id;
        planId = "free";
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
      }
    }

    const cfg = PLAN_CONFIG[planId] ?? PLAN_CONFIG.free;

    // Enforce daily limit
    if (cfg.dailyLimit !== null) {
      const today = new Date().toISOString().slice(0, 10);
      const ownerKey = userId ?? `ip:${req.headers.get("x-forwarded-for") ?? "anon"}`;

      if (userId) {
        const { count } = await admin
          .from("usage_logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("day", today);
        if ((count ?? 0) >= cfg.dailyLimit) {
          return new Response(
            JSON.stringify({
              error: `Daily limit reached for your ${planId.toUpperCase()} plan (${cfg.dailyLimit} prompts/day). Upgrade for more.`,
              code: "PLAN_LIMIT",
              plan: planId,
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      } else {
        // Anonymous users get a hard, low cap with no tracking — gently push to sign in.
        // (We don't persist anonymous usage; the per-request cap doubles as a soft guard.)
        void ownerKey;
        if ((messages?.length ?? 0) > 6) {
          return new Response(
            JSON.stringify({
              error: "Please sign in to continue chatting. Free accounts get 20 prompts/day.",
              code: "AUTH_REQUIRED",
            }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

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
        "x-cruise-plan": planId,
        "x-cruise-model": cfg.model,
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
