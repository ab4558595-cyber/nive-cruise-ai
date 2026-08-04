import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { ModeStudio } from "@/components/ModeStudio";

export const Route = createFileRoute("/product")({
  head: () => ({
    meta: [
      { title: "Product & PRD Studio — Nive AI" },
      { name: "description", content: "Turn a rough idea into a PRD, user stories with acceptance criteria, a now/next/later roadmap, RICE prioritisation, a discovery research plan and release notes." },
      { property: "og:title", content: "Product & PRD Studio — Nive AI" },
      { property: "og:description", content: "PRDs, user stories, roadmaps, RICE scoring, research plans and release notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/product" }],
  }),
  component: ProductPage,
});

function ProductPage() {
  return (
    <ModeStudio
      title="Product & PRD Studio"
      subtitle="From a one-line idea to a spec engineers can build, a roadmap leadership can read, and release notes users actually understand."
      icon={ClipboardList}
      accent="#2563eb"
      inputLabel="Idea, backlog or changelog"
      placeholder="Describe the product idea, paste the backlog, or list the changes you shipped…"
      contextPlaceholder="Team size, stack, timeline, target user"
      examples={[
        "Idea: let teams schedule Nive marketing outputs straight to LinkedIn and X.",
        "Prioritise: SSO, usage dashboard, template gallery, mobile app, API keys.",
      ]}
      modes={[
        { id: "product.prd", label: "PRD", desc: "Problem, scope, metrics, rollout." },
        { id: "product.stories", label: "User stories", desc: "Given-When-Then acceptance criteria." },
        { id: "product.roadmap", label: "Roadmap", desc: "Now / next / later with outcomes." },
        { id: "product.rice", label: "Prioritisation", desc: "RICE table with visible maths." },
        { id: "product.research", label: "Research plan", desc: "Method plus non-leading questions." },
        { id: "product.release", label: "Release notes", desc: "Highlights, fixes, migrations." },
      ]}
    />
  );
}
