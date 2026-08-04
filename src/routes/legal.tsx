import { createFileRoute } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import { ModeStudio } from "@/components/ModeStudio";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal & Policy Agent — Nive AI" },
      { name: "description", content: "Draft privacy policies and terms, review contract clauses with a risk table, rewrite legal text in plain English, and build compliance checklists and data-processing maps." },
      { property: "og:title", content: "Legal & Policy Agent — Nive AI" },
      { property: "og:description", content: "Policy drafts, clause reviews, plain-English rewrites, compliance checklists and formal notices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/legal" }],
  }),
  component: LegalPage,
});

function LegalPage() {
  return (
    <ModeStudio
      title="Legal & Policy Agent"
      subtitle="Draft the document, understand the clause, and know what to negotiate first. Drafting support — not a substitute for your lawyer."
      icon={Scale}
      accent="#0a2540"
      inputLabel="Document, clause or request"
      placeholder="Paste the contract or clause, or describe the policy you need…"
      contextPlaceholder="Company, jurisdiction, industry, counterparty"
      examples={[
        "Draft a privacy policy for an Indian SaaS that generates synthetic test data.",
        "Review this SaaS reseller clause: (paste clause text)",
      ]}
      modes={[
        { id: "legal.policy", label: "Draft policy", desc: "Numbered clauses with placeholders." },
        { id: "legal.review", label: "Clause review", desc: "Risk table plus suggested redlines." },
        { id: "legal.plain", label: "Plain English", desc: "Readable rewrite, same obligations." },
        { id: "legal.checklist", label: "Compliance checklist", desc: "Must / should / consider items." },
        { id: "legal.dpa", label: "Data mapping / DPA", desc: "Purposes, retention, sub-processors." },
        { id: "legal.notice", label: "Notice / letter", desc: "Firm, factual formal correspondence." },
      ]}
    />
  );
}
