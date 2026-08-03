import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ModeStudio } from "@/components/ModeStudio";

export const Route = createFileRoute("/seo")({
  head: () => ({
    meta: [
      { title: "SEO & Analytics Studio — Nive AI" },
      { name: "description", content: "Keyword clusters, on-page audits, writer-ready content briefs, technical checklists, competitor gap analysis, JSON-LD and stakeholder analytics reports." },
      { property: "og:title", content: "SEO & Analytics Studio — Nive AI" },
      { property: "og:description", content: "Keyword clusters, audits, content briefs, schema markup and analytics reports in one studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/seo" }],
  }),
  component: SeoPage,
});

function SeoPage() {
  return (
    <ModeStudio
      title="SEO & Analytics Studio"
      subtitle="Plan the keywords, audit the page, brief the writer, ship the schema — then turn the numbers into a report a stakeholder actually reads."
      icon={Search}
      accent="#ff8a00"
      inputLabel="Topic, page content or metrics"
      placeholder="Describe the site and topic, or paste the page copy / HTML / metrics table…"
      contextPlaceholder="Market, language, competitors, current rankings"
      examples={[
        "Topic: synthetic test data for fintech QA teams in India. Site sells a SaaS generator.",
        "Audit this page: AI marketing tool landing copy (paste the full page text)",
      ]}
      modes={[
        { id: "seo.clusters", label: "Keyword clusters", desc: "Clusters, intent, page types, quick wins." },
        { id: "seo.brief", label: "Content brief", desc: "Outline, entities, metas, FAQ block." },
        { id: "seo.audit", label: "On-page audit", desc: "Prioritised fix table by impact/effort." },
        { id: "seo.technical", label: "Technical checklist", desc: "Crawl, CWV, canonicals, structured data." },
        { id: "seo.competitors", label: "Competitor gap", desc: "Gaps plus a 30-day catch-up plan." },
        { id: "seo.schema", label: "Schema / JSON-LD", desc: "Valid JSON-LD blocks per page type." },
        { id: "seo.report", label: "Analytics report", desc: "What moved, why, and what to test." },
      ]}
    />
  );
}
