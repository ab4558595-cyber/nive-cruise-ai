const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an elite AI coding assistant capable of writing code in ANY language or platform — including but not limited to: JavaScript/TypeScript, Python, Rust, Go, C/C++, C#, Java, Kotlin, Swift, Arduino/C++ for microcontrollers (ESP32, Arduino Uno, Raspberry Pi Pico), embedded firmware, mobile apps (React Native, Flutter, SwiftUI, Jetpack Compose), web apps (React, Vue, Svelte, Next.js), backend APIs, shell scripts, SQL, HTML/CSS, game code (Unity C#, Godot, Pygame), ML/AI scripts, hardware/IoT projects, and more.

Rules:
- Ask brief clarifying questions ONLY if absolutely required; otherwise produce working code immediately.
- Always wrap code in fenced \`\`\`language code blocks with the correct language tag.
- Include file names as headers (e.g. **main.ino**) when the answer has multiple files.
- For Arduino/embedded: specify board, pin wiring, and required libraries.
- For app code: list dependencies and a quick run command.
- Keep prose concise. Lead with the code, then a short explanation.
- If the user just chats, respond helpfully and offer to write code.`;

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
        model: "google/gemini-3-flash-preview",
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
