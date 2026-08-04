import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ModeStudio } from "@/components/ModeStudio";

export const Route = createFileRoute("/hr")({
  head: () => ({
    meta: [
      { title: "People & Hiring Agent — Nive AI" },
      { name: "description", content: "Write inclusive job posts, build hiring scorecards and interview kits, screen resumes against real requirements, draft offer and rejection notes, and plan 30-60-90 day onboarding." },
      { property: "og:title", content: "People & Hiring Agent — Nive AI" },
      { property: "og:description", content: "Job posts, scorecards, interview kits, resume screens, offers and onboarding plans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/hr" }],
  }),
  component: HrPage,
});

function HrPage() {
  return (
    <ModeStudio
      title="People & Hiring Agent"
      subtitle="Hire with structure: a clear post, a scorecard everyone rates against, questions that reveal signal, and an onboarding plan that ends in a shipped win."
      icon={Users}
      accent="#7c3aed"
      inputLabel="Role brief, résumé or thread"
      placeholder="Describe the role, or paste the résumé / candidate thread…"
      contextPlaceholder="Company stage, location, salary band, seniority"
      examples={[
        "Role: first full-stack engineer at a 4-person AI startup in Bengaluru, hybrid.",
        "Screen this résumé against a mid-level growth marketer role (paste résumé)",
      ]}
      modes={[
        { id: "hr.jobpost", label: "Job post", desc: "Inclusive, specific, bias-checked." },
        { id: "hr.scorecard", label: "Scorecard", desc: "Outcomes plus a 1-4 rubric." },
        { id: "hr.interview", label: "Interview kit", desc: "Questions, exercise, grading." },
        { id: "hr.screen", label: "Résumé screen", desc: "Evidence, gaps, recommendation." },
        { id: "hr.offer", label: "Offer & comms", desc: "Offers, rejections, keep-warms." },
        { id: "hr.onboarding", label: "Onboarding plan", desc: "30-60-90 with a first win." },
      ]}
    />
  );
}
