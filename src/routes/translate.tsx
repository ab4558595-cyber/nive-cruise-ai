import { createFileRoute } from "@tanstack/react-router";
import { Languages } from "lucide-react";
import { ModeStudio } from "@/components/ModeStudio";

export const Route = createFileRoute("/translate")({
  head: () => ({
    meta: [
      { title: "Translation & Localization — Nive AI" },
      { name: "description", content: "Translate and localise copy across markets: market adaptation, transcreated marketing lines, glossaries and style guides, linguistic QA and ready-to-ship i18n locale files." },
      { property: "og:title", content: "Translation & Localization — Nive AI" },
      { property: "og:description", content: "Translate, localise, transcreate, QA and export i18n keys for every market you sell in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/translate" }],
  }),
  component: TranslatePage,
});

function TranslatePage() {
  return (
    <ModeStudio
      title="Translation & Localization"
      subtitle="Ship in more languages without losing the voice. Translation, market adaptation, transcreation and QA — plus locale files your app can import."
      icon={Languages}
      accent="#0a7c66"
      inputLabel="Source text, translation or UI copy"
      placeholder="Paste the copy, UI strings or existing translation to review…"
      contextPlaceholder="Target languages, market, formality, product terms"
      examples={[
        "Translate to Hindi, Tamil and Spanish (LatAm): our pricing page copy.",
        "Localise this onboarding email for Germany — formal, EUR, GDPR wording.",
      ]}
      modes={[
        { id: "translate.translate", label: "Translate", desc: "Faithful, placeholder-safe translation." },
        { id: "translate.localize", label: "Localise", desc: "Currency, units, idiom, tone norms." },
        { id: "translate.transcreate", label: "Transcreate", desc: "Native-sounding marketing rewrites." },
        { id: "translate.glossary", label: "Glossary & style", desc: "Term table plus tone rules." },
        { id: "translate.qa", label: "Translation QA", desc: "Findings table and corrected text." },
        { id: "translate.keys", label: "i18n keys", desc: "Flat JSON locale files with notes." },
      ]}
    />
  );
}
