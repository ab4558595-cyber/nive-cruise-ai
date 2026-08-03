import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";
import { ModeStudio } from "@/components/ModeStudio";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support & Email Agent — Nive AI" },
      { name: "description", content: "Draft support replies, build macro libraries, write escalation handoffs, rewrite tone, and ship transactional emails and help-centre articles." },
      { property: "og:title", content: "Support & Email Agent — Nive AI" },
      { property: "og:description", content: "Replies, macros, escalations, tone rewrites and help-centre articles for support teams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/support" }],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <ModeStudio
      title="Support & Email Agent"
      subtitle="Paste the ticket, get a reply you'd actually send. Plus macro libraries, escalation handoffs, tone rewrites, lifecycle emails and help-centre articles."
      icon={LifeBuoy}
      accent="#7c3aed"
      inputLabel="Customer message, thread or draft"
      placeholder="Paste the customer's message or the full ticket thread here…"
      contextPlaceholder="Product name, tone (friendly / formal), known fix, SLA"
      modes={[
        { id: "support.reply", label: "Draft reply", desc: "Short and long versions, right tone." },
        { id: "support.macros", label: "Macro library", desc: "10 canned responses with variables." },
        { id: "support.escalation", label: "Escalation summary", desc: "Impact, timeline, repro, severity." },
        { id: "support.tone", label: "Tone rewrite", desc: "Friendly / formal / firm variants." },
        { id: "support.email", label: "Transactional email", desc: "Subjects, preview, body, CTA." },
        { id: "support.kb", label: "Help-centre article", desc: "Symptom, steps, escalation path." },
      ]}
    />
  );
}
