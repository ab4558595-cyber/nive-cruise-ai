import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Database, Megaphone, History as HistoryIcon, Loader2 } from "lucide-react";
import { Ribbon } from "@/components/Ribbon";
import { BusinessAuthGate } from "@/components/BusinessAuthGate";
import {
  getBusinessUsageHistory,
  type UsageHistoryDay,
} from "@/lib/businessUsage.functions";

export const Route = createFileRoute("/business/usage")({
  head: () => ({
    meta: [
      { title: "Usage History — Nive AI for Business" },
      {
        name: "description",
        content:
          "Review your synthetic data and marketing generation history by day, with timestamps and credits consumed.",
      },
    ],
    links: [{ rel: "canonical", href: "/business/usage" }],
  }),
  component: () => (
    <BusinessAuthGate>
      <UsagePage />
    </BusinessAuthGate>
  ),
});

function UsagePage() {
  const fetchHistory = useServerFn(getBusinessUsageHistory);
  const [days, setDays] = useState<UsageHistoryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState(14);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchHistory({ data: { days: range } })
      .then((d) => {
        if (active) setDays(d);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Failed to load history");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range, fetchHistory]);

  const totalSynth = days.reduce((s, d) => s + d.synthetic.credits, 0);
  const totalMkt = days.reduce((s, d) => s + d.marketing.credits, 0);
  const totalTopup = days.reduce((s, d) => s + d.topupsInr, 0);

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-white text-[#0a2540]"
      style={{ fontFamily: "'Inter', 'Sohne', system-ui, -apple-system, sans-serif" }}
    >
      <Ribbon />

      <header className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/business" className="text-[22px] font-bold tracking-tight text-[#0a2540]">
          nive<span className="ml-1 text-[#635bff]">/business</span>
        </Link>
        <Link
          to="/business"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0a2540]/70 transition-colors hover:text-[#635bff]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to overview
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-[1180px] px-6 pb-24 pt-6 sm:px-10 sm:pt-10">
        <div className="mb-8 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#635bff]/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#635bff]">
            <HistoryIcon className="h-3.5 w-3.5" /> Usage History
          </div>
          <h1 className="text-[34px] font-bold leading-[1.05] tracking-tight text-[#0a2540] sm:text-[44px]">
            Your runs, day by day.
          </h1>
          <p className="mt-3 text-[15px] text-[#425466]">
            Every synthetic data and marketing generation, with timestamps and credits consumed.
            Credits reset at midnight UTC each day.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#697386]">
            Range:
          </span>
          {[7, 14, 30, 60].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRange(n)}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-all ${
                range === n
                  ? "border-[#635bff] bg-[#635bff] text-white"
                  : "border-[#e3e8ee] bg-white text-[#0a2540] hover:border-[#635bff] hover:text-[#635bff]"
              }`}
            >
              Last {n} days
            </button>
          ))}
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<Database className="h-4 w-4" />}
            label="Synthetic data runs"
            value={totalSynth.toString()}
            sub={`${totalSynth} credits`}
          />
          <SummaryCard
            icon={<Megaphone className="h-4 w-4" />}
            label="Marketing runs"
            value={totalMkt.toString()}
            sub={`${totalMkt} credits`}
          />
          <SummaryCard
            icon={<HistoryIcon className="h-4 w-4" />}
            label="Top-ups spent"
            value={`₹${totalTopup}`}
            sub={`Last ${range} days`}
          />
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[#e3e8ee]">
            <Loader2 className="h-5 w-5 animate-spin text-[#635bff]" />
          </div>
        ) : error ? (
          <div className="rounded-md bg-[#fff1f0] px-4 py-3 text-[13px] text-[#c0392b]">
            {error}
          </div>
        ) : days.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#e3e8ee] text-center">
            <p className="text-[14px] font-medium text-[#0a2540]">No runs yet.</p>
            <p className="text-[13px] text-[#697386]">
              Generate your first dataset or marketing copy to see it here.
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                to="/business/synthetic-data"
                className="rounded-full bg-[#635bff] px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#5048d6]"
              >
                Generate data
              </Link>
              <Link
                to="/business/marketing"
                className="rounded-full border border-[#e3e8ee] bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-[#0a2540] hover:border-[#635bff]"
              >
                Marketing copy
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {days.map((d) => (
              <DayCard key={d.day} day={d} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_10px_30px_rgba(50,50,93,0.06),0_4px_10px_rgba(0,0,0,0.03)] ring-1 ring-[#e3e8ee]">
      <div className="flex items-center gap-2 text-[#635bff]">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#635bff]/10">
          {icon}
        </span>
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#697386]">
          {label}
        </span>
      </div>
      <div className="mt-2 text-[28px] font-bold tracking-tight text-[#0a2540]">{value}</div>
      <div className="text-[12px] text-[#697386]">{sub}</div>
    </div>
  );
}

function DayCard({ day }: { day: UsageHistoryDay }) {
  const date = new Date(`${day.day}T00:00:00Z`);
  const label = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_15px_50px_rgba(50,50,93,0.06),0_5px_15px_rgba(0,0,0,0.03)] ring-1 ring-[#e3e8ee]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1f5] bg-[#fafbfc] px-5 py-3">
        <div>
          <div className="text-[14px] font-semibold text-[#0a2540]">{label}</div>
          <div className="text-[11.5px] text-[#697386]">UTC</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill
            icon={<Database className="h-3 w-3" />}
            label={`${day.synthetic.runs} synthetic · ${day.synthetic.credits} cr`}
            tone="indigo"
          />
          <Pill
            icon={<Megaphone className="h-3 w-3" />}
            label={`${day.marketing.runs} marketing · ${day.marketing.credits} cr`}
            tone="pink"
          />
          {day.topupsInr > 0 && (
            <Pill icon={<HistoryIcon className="h-3 w-3" />} label={`₹${day.topupsInr} top-ups`} tone="amber" />
          )}
        </div>
      </div>

      {day.events.length === 0 ? (
        <div className="px-5 py-4 text-[13px] text-[#697386]">No individual runs logged.</div>
      ) : (
        <table className="w-full text-left text-[13px]">
          <thead className="bg-white text-[11px] font-semibold uppercase tracking-wider text-[#697386]">
            <tr>
              <th className="px-5 py-2.5">Time (local)</th>
              <th className="px-5 py-2.5">Tool</th>
              <th className="px-5 py-2.5 text-right">Credits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef1f5]">
            {day.events.map((e) => (
              <tr key={e.id} className="text-[#3c4257]">
                <td className="px-5 py-2.5 font-mono text-[12.5px] text-[#0a2540]">
                  {new Date(e.at).toLocaleTimeString()}
                </td>
                <td className="px-5 py-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                      e.tool === "synthetic"
                        ? "bg-[#635bff]/10 text-[#635bff]"
                        : "bg-[#ec4899]/10 text-[#ec4899]"
                    }`}
                  >
                    {e.tool === "synthetic" ? (
                      <Database className="h-3 w-3" />
                    ) : (
                      <Megaphone className="h-3 w-3" />
                    )}
                    {e.tool}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-right font-semibold text-[#0a2540]">
                  {e.credits}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Pill({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "indigo" | "pink" | "amber";
}) {
  const colors: Record<typeof tone, string> = {
    indigo: "bg-[#635bff]/10 text-[#635bff] ring-[#635bff]/20",
    pink: "bg-[#ec4899]/10 text-[#ec4899] ring-[#ec4899]/20",
    amber: "bg-[#fff8e6] text-[#8a6100] ring-[#f5e2a8]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 ${colors[tone]}`}
    >
      {icon}
      {label}
    </span>
  );
}
