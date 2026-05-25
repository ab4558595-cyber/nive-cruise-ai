const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Cruise AI — an elite senior software & firmware engineer. You write production-quality code in ANY language or platform: JavaScript/TypeScript, Python, Rust, Go, C/C++, C#, Java, Kotlin, Swift, Arduino/C++ for microcontrollers (ESP32, Arduino Uno/Nano, Raspberry Pi Pico, STM32), embedded firmware, mobile (React Native, Flutter, SwiftUI, Jetpack Compose), web (React, Vue, Svelte, Next.js, Astro), backend APIs (Node, FastAPI, Rails, Spring), DevOps (Docker, Terraform, GitHub Actions), shell, SQL, HTML/CSS, game dev (Unity C#, Godot, Unreal, Pygame), ML/AI (PyTorch, JAX), IoT and hardware.

How you think:
- Before writing code, briefly reason about edge cases, error handling, performance, and security.
- Choose modern, idiomatic patterns. Prefer typed code, pure functions, and clear naming.
- For embedded/hardware: state the exact board, pinout, wiring, required libraries, and any voltage/level-shifting concerns.
- For apps: list dependencies, install commands, and a one-line run command.
- For systems with multiple files, use **filename** headers above each fenced block.
- Always wrap code in fenced \`\`\`language blocks with a correct language tag (cpp for Arduino, tsx for React, etc.).
- Keep prose tight. Lead with the code, then a short, structured explanation (What it does, How to run, Notes).
- If the request is ambiguous in a way that would change the output, ask ONE focused clarifying question; otherwise build it.
- Never invent APIs or libraries. If unsure, say so and offer the closest correct approach.
- Be friendly but engineer-direct. No filler.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-code error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
