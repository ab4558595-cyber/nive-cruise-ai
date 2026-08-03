import { createFileRoute } from "@tanstack/react-router";
import { BookMarked } from "lucide-react";
import { ModeStudio } from "@/components/ModeStudio";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Docs & Knowledge Agent — Nive AI" },
      { name: "description", content: "Paste any document and get summaries, grounded Q&A, internal wiki pages, FAQs, onboarding guides and training flashcards." },
      { property: "og:title", content: "Docs & Knowledge Agent — Nive AI" },
      { property: "og:description", content: "Turn documents into summaries, wikis, FAQs and onboarding guides with grounded answers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/knowledge" }],
  }),
  component: KnowledgePage,
});

function KnowledgePage() {
  return (
    <ModeStudio
      title="Docs & Knowledge Agent"
      subtitle="Drop in a spec, contract, transcript or help-centre dump. Nive turns it into summaries, grounded answers, wiki pages, FAQs and training material — quoting the source line so you can trust it."
      icon={BookMarked}
      accent="#0a7c66"
      inputLabel="Document or notes"
      placeholder="Paste the document, meeting transcript, product spec or policy text here…"
      contextPlaceholder="Questions to answer, audience, or which team will read this"
      modes={[
        { id: "knowledge.summary", label: "Executive summary", desc: "TL;DR, key points, numbers, risks." },
        { id: "knowledge.qa", label: "Grounded Q&A", desc: "Answers with quoted source lines." },
        { id: "knowledge.wiki", label: "Internal wiki page", desc: "Purpose, owners, how it works." },
        { id: "knowledge.faq", label: "FAQ generator", desc: "10-15 customer FAQs by theme." },
        { id: "knowledge.onboarding", label: "Onboarding guide", desc: "Day 1 / Week 1 / Month 1 plan." },
        { id: "knowledge.flashcards", label: "Training flashcards", desc: "15 Q&A cards for enablement." },
      ]}
    />
  );
}
