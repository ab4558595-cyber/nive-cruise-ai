import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function page(title: string, body: string) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:system-ui;background:#0a0a14;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .card{max-width:480px;padding:32px;border-radius:16px;background:#151525;border:1px solid #2a2a44;text-align:center}
    h1{margin:0 0 12px}a{color:#a78bfa}</style></head>
    <body><div class="card"><h1>${title}</h1><p>${body}</p><p><a href="/admin">Open admin dashboard</a></p></div></body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export const Route = createFileRoute("/api/public/approve-payment")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        const action = url.searchParams.get("action");
        if (!token || (action !== "approve" && action !== "reject")) {
          return page("Invalid link", "This approval link is missing required parameters.");
        }

        const { data: req } = await supabaseAdmin
          .from("payment_requests")
          .select("*")
          .eq("approval_token", token)
          .maybeSingle();

        if (!req) return page("Not found", "No payment request matches this token.");
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
          return page("Approved ✓", `${req.user_email} now has access to the <b>${req.plan_id}</b> plan for 30 days.`);
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
