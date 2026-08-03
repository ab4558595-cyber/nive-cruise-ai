import { createFileRoute } from "@tanstack/react-router";
import { LineChart } from "lucide-react";
import { ModeStudio } from "@/components/ModeStudio";

export const Route = createFileRoute("/analyst")({
  head: () => ({
    meta: [
      { title: "Data Analyst — Nive AI" },
      { name: "description", content: "Paste a CSV and get insights, PostgreSQL queries, cleaning plans, Vega-Lite chart specs, statistical review and forecasting guidance." },
      { property: "og:title", content: "Data Analyst — Nive AI" },
      { property: "og:description", content: "Turn raw CSV into insights, SQL, charts and forecasts without leaving the browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/analyst" }],
  }),
  component: AnalystPage,
});

function AnalystPage() {
  return (
    <ModeStudio
      title="Data Analyst"
      subtitle="Paste rows straight from a spreadsheet or export. Nive infers the schema, flags quality issues, and hands back insights, SQL, chart specs and an honest read on what the data can't prove."
      icon={LineChart}
      accent="#2563eb"
      inputLabel="Data (CSV, TSV or a described dataset)"
      placeholder={"order_id,created_at,country,plan,mrr,churned\n1001,2026-01-04,IN,growth,2400,false"}
      contextPlaceholder="The question you're trying to answer"
      modes={[
        { id: "analyst.insights", label: "Insights", desc: "Overview, quality issues, 5 findings." },
        { id: "analyst.sql", label: "SQL queries", desc: "DDL plus 6 analytical queries." },
        { id: "analyst.clean", label: "Cleaning plan", desc: "Per-column fixes with pandas code." },
        { id: "analyst.chart", label: "Chart recipes", desc: "4 charts with Vega-Lite specs." },
        { id: "analyst.stats", label: "Statistical review", desc: "Right test, assumptions, Python." },
        { id: "analyst.forecast", label: "Forecast plan", desc: "Baseline, metric, uncertainty." },
      ]}
    />
  );
}
