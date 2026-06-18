import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getClientIp, rateLimit, RateLimitError } from "@/lib/rate-limit.server";

function page(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:system-ui;background:#0a0a14;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .card{max-width:480px;padding:32px;border-radius:16px;background:#151525;border:1px solid #2a2a44;text-align:center}
    h1{margin:0 0 12px}a{color:#a78bfa}</style></head>
    <body><div class="card"><h1>${title}</h1><p>${body}</p><p><a href="/admin">Open admin dashboard</a></p></div></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

// Constant-time string compare to prevent token-timing attacks.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/approve-payment")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Throttle brute-force token guessing: 20 attempts / hour / IP.
        const ip = getClientIp(request);
        try {
          await rateLimit(ip, "approve-payment", 20, 3600);
        } catch (e) {
          if (e instanceof RateLimitError) {
            return page(
              "Too many attempts",
              "This link has been used too often from your network. Please try again later.",
              429,
            );
          }
        }

        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        const action = url.searchParams.get("action");
        if (!token || (action !== "approve" && action !== "reject")) {
          return page("Invalid link", "This approval link is missing required parameters.", 400);
        }
        if (token.length < 16 || token.length > 200) {
          return page("Invalid link", "This approval link is malformed.", 400);
        }

        const { data: req } = await supabaseAdmin
          .from("payment_requests")
          .select("*")
          .eq("approval_token", token)
          .maybeSingle();

        // Constant-time confirmation of returned token to catch any caching weirdness.
        if (!req || !safeEqual(String(req.approval_token ?? ""), token)) {
          return page("Not found", "No payment request matches this token.", 404);
        }
        if (req.status !== "pending")
          return page("Already handled", `This request is already <b>${req.status}</b>.`);

        if (action === "approve") {
          await supabaseAdmin
            .from("payment_requests")
            .update({ status: "approved", approved_at: new Date().toISOString() })
            .eq("id", req.id);
          const expires = new Date();
          expires.setDate(expires.getDate() + 30);
          await supabaseAdmin.from("user_plans").insert({
            user_id: req.user_id,
            plan_id: req.plan_id,
            expires_at: expires.toISOString(),
            active: true,
          });
          return page(
            "Approved ✓",
            `${req.user_email} now has access to the <b>${req.plan_id}</b> plan for 30 days.`,
          );
        } else {
          await supabaseAdmin
            .from("payment_requests")
            .update({ status: "rejected" })
            .eq("id", req.id);
          return page("Rejected", `Payment request from ${req.user_email} marked as rejected.`);
        }
      },
    },
  },
});
