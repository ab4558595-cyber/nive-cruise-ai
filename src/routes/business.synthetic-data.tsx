import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Database, Download, Sparkles, Loader2 } from "lucide-react";
import { Ribbon } from "@/components/Ribbon";
import { BusinessAuthGate } from "@/components/BusinessAuthGate";
import { useUsage, UsageBadge } from "@/components/UsageBadge";
import { useServerFn } from "@tanstack/react-start";
import { consumeBusinessUsage } from "@/lib/businessUsage.functions";

export const Route = createFileRoute("/business/synthetic-data")({
  head: () => ({
    meta: [
      { title: "Synthetic Data Generator — Nive AI for Business" },
      {
        name: "description",
        content:
          "Generate privacy-safe synthetic datasets in seconds. Define your schema, pick row count, export to CSV or JSON.",
      },
      { property: "og:title", content: "Synthetic Data Generator — Nive AI" },
      {
        property: "og:description",
        content: "Create realistic, anonymous datasets for testing, demos, and ML.",
      },
    ],
    links: [{ rel: "canonical", href: "/business/synthetic-data" }],
  }),
  component: () => (
    <BusinessAuthGate>
      <SyntheticDataPage />
    </BusinessAuthGate>
  ),
});

// --- Deterministic fake-data helpers (no external deps) -----------------
const FIRST = ["Aanya","Vikram","Maya","Rohan","Priya","Arjun","Sara","Kabir","Isha","Dev","Anika","Ravi","Neha","Aarav","Diya","Yash","Riya","Zoya","Aditya","Tara"];
const LAST = ["Sharma","Patel","Khan","Iyer","Singh","Reddy","Nair","Gupta","Mehta","Shah","Joshi","Kapoor","Rao","Verma","Bose","Chopra"];
const CITIES = ["Mumbai","Delhi","Bengaluru","Pune","Hyderabad","Chennai","Kolkata","Jaipur","Ahmedabad","Goa"];
const PRODUCTS = ["Notebook","Headphones","Coffee Mug","Backpack","Sneakers","Desk Lamp","Phone Case","Water Bottle","T-shirt","Keyboard"];
const STATUS = ["pending","paid","shipped","delivered","cancelled"];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(arr: T[], rnd: () => number) => arr[Math.floor(rnd() * arr.length)];
const intBetween = (rnd: () => number, lo: number, hi: number) =>
  Math.floor(rnd() * (hi - lo + 1)) + lo;

type FieldType = "id" | "first_name" | "last_name" | "full_name" | "email" | "city" | "phone" | "age" | "amount" | "product" | "status" | "date" | "boolean";

type Field = { name: string; type: FieldType };

function genValue(type: FieldType, rnd: () => number, i: number): string | number | boolean {
  switch (type) {
    case "id":
      return i + 1;
    case "first_name":
      return pick(FIRST, rnd);
    case "last_name":
      return pick(LAST, rnd);
    case "full_name":
      return `${pick(FIRST, rnd)} ${pick(LAST, rnd)}`;
    case "email": {
      const f = pick(FIRST, rnd).toLowerCase();
      const l = pick(LAST, rnd).toLowerCase();
      return `${f}.${l}${intBetween(rnd, 1, 999)}@example.com`;
    }
    case "city":
      return pick(CITIES, rnd);
    case "phone":
      return `+91 ${intBetween(rnd, 70000, 99999)} ${intBetween(rnd, 10000, 99999)}`;
    case "age":
      return intBetween(rnd, 18, 72);
    case "amount":
      return Math.round(intBetween(rnd, 99, 49999) * 100) / 100;
    case "product":
      return pick(PRODUCTS, rnd);
    case "status":
      return pick(STATUS, rnd);
    case "date": {
      const d = new Date(Date.now() - intBetween(rnd, 0, 365) * 86400000);
      return d.toISOString().slice(0, 10);
    }
    case "boolean":
      return rnd() > 0.5;
  }
}

function generateRows(fields: Field[], count: number, seed: number) {
  const rnd = mulberry32(seed);
  const rows: Record<string, string | number | boolean>[] = [];
  for (let i = 0; i < count; i++) {
    const row: Record<string, string | number | boolean> = {};
    for (const f of fields) row[f.name] = genValue(f.type, rnd, i);
    rows.push(row);
  }
  return rows;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\n");
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const FIELD_TYPES: FieldType[] = ["id","first_name","last_name","full_name","email","city","phone","age","amount","product","status","date","boolean"];

const PRESETS: { name: string; fields: Field[] }[] = [
  {
    name: "Customers",
    fields: [
      { name: "id", type: "id" },
      { name: "name", type: "full_name" },
      { name: "email", type: "email" },
      { name: "city", type: "city" },
      { name: "phone", type: "phone" },
      { name: "age", type: "age" },
    ],
  },
  {
    name: "Orders",
    fields: [
      { name: "order_id", type: "id" },
      { name: "customer", type: "full_name" },
      { name: "product", type: "product" },
      { name: "amount", type: "amount" },
      { name: "status", type: "status" },
      { name: "ordered_at", type: "date" },
    ],
  },
  {
    name: "Users (auth)",
    fields: [
      { name: "id", type: "id" },
      { name: "email", type: "email" },
      { name: "is_active", type: "boolean" },
      { name: "created_at", type: "date" },
    ],
  },
];

function SyntheticDataPage() {
  const consume = useServerFn(consumeBusinessUsage);
  const { usage, setUsage } = useUsage("synthetic");
  const [fields, setFields] = useState<Field[]>(PRESETS[0].fields);
  const [count, setCount] = useState(50);
  const [seed, setSeed] = useState(42);
  const [rows, setRows] = useState<Record<string, string | number | boolean>[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    if (usage && usage.remaining <= 0) {
      setError(`Daily limit reached (${usage.limit}/day). Resets at midnight UTC.`);
      return;
    }
    setGenerating(true);
    try {
      const next = await consume({ data: { tool: "synthetic" } });
      setUsage(next);
      const safeCount = Math.max(1, Math.min(5000, Math.floor(count) || 1));
      const data = generateRows(
        fields.filter((f) => f.name.trim().length > 0),
        safeCount,
        seed,
      );
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const previewRows = useMemo(() => rows.slice(0, 25), [rows]);


  const updateField = (idx: number, patch: Partial<Field>) => {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };
  const addField = () =>
    setFields((prev) => [...prev, { name: `field_${prev.length + 1}`, type: "full_name" }]);
  const removeField = (idx: number) =>
    setFields((prev) => prev.filter((_, i) => i !== idx));

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
        <div className="flex items-center gap-3">
          <UsageBadge usage={usage} />
          <Link
            to="/business"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0a2540]/70 transition-colors hover:text-[#635bff]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to overview
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1180px] px-6 pb-24 pt-6 sm:px-10 sm:pt-10">
        <div className="mb-8 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#635bff]/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#635bff]">
            <Database className="h-3.5 w-3.5" /> Synthetic Data
          </div>
          <h1 className="text-[34px] font-bold leading-[1.05] tracking-tight text-[#0a2540] sm:text-[44px]">
            Generate realistic datasets in seconds.
          </h1>
          <p className="mt-3 text-[15px] text-[#425466]">
            Pick a preset or define your own schema, choose row count, and export to CSV / JSON.
            Every value is synthetic — no real records are used.
          </p>
        </div>

        {/* Presets */}
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="self-center text-[12px] font-semibold uppercase tracking-wider text-[#697386]">
            Examples:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setFields(p.fields)}
              className="rounded-full border border-[#e3e8ee] bg-white px-3 py-1.5 text-[13px] font-medium text-[#0a2540] transition-all hover:border-[#635bff] hover:text-[#635bff]"
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          {/* Form */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(50,50,93,0.08),0_5px_15px_rgba(0,0,0,0.04)] ring-1 ring-[#e3e8ee]">
            <h2 className="text-[16px] font-semibold text-[#0a2540]">Schema</h2>
            <p className="mt-1 text-[12px] text-[#697386]">Up to 12 fields.</p>

            <div className="mt-4 space-y-2">
              {fields.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={f.name}
                    onChange={(e) => updateField(i, { name: e.target.value.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32) })}
                    className="w-[44%] rounded-md border border-[#e3e8ee] bg-white px-2.5 py-1.5 text-[13px] text-[#0a2540] outline-none focus:border-[#635bff]"
                    placeholder="field_name"
                  />
                  <select
                    value={f.type}
                    onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                    className="flex-1 rounded-md border border-[#e3e8ee] bg-white px-2.5 py-1.5 text-[13px] text-[#0a2540] outline-none focus:border-[#635bff]"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeField(i)}
                    disabled={fields.length <= 1}
                    className="rounded-md px-2 py-1 text-[12px] text-[#697386] transition-colors hover:bg-[#f6f9fc] hover:text-[#ff5a36] disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {fields.length < 12 && (
                <button
                  type="button"
                  onClick={addField}
                  className="mt-2 w-full rounded-md border border-dashed border-[#cfd7df] py-2 text-[13px] font-medium text-[#635bff] hover:bg-[#f6f9fc]"
                >
                  + Add field
                </button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[12px] font-medium text-[#697386]">Rows (1–5000)</span>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#e3e8ee] bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[#635bff]"
                />
              </label>
              <label className="block">
                <span className="text-[12px] font-medium text-[#697386]">Seed</span>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#e3e8ee] bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[#635bff]"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#635bff] py-2.5 text-[14px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.25)] transition-all hover:bg-[#5048d6] disabled:opacity-60"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate dataset
            </button>
            {error && (
              <p className="mt-3 text-[13px] font-medium text-[#c8341c]">{error}</p>
            )}
          </div>

          {/* Results */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(50,50,93,0.08),0_5px_15px_rgba(0,0,0,0.04)] ring-1 ring-[#e3e8ee]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold text-[#0a2540]">Results</h2>
                <p className="mt-0.5 text-[12px] text-[#697386]">
                  {rows.length ? `${rows.length} rows · previewing first ${previewRows.length}` : "No data yet — generate to see preview."}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!rows.length}
                  onClick={() => download(`synthetic-${Date.now()}.csv`, toCSV(rows), "text/csv")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0a2540] transition-all hover:border-[#635bff] hover:text-[#635bff] disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5" /> CSV
                </button>
                <button
                  type="button"
                  disabled={!rows.length}
                  onClick={() => download(`synthetic-${Date.now()}.json`, JSON.stringify(rows, null, 2), "application/json")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0a2540] transition-all hover:border-[#635bff] hover:text-[#635bff] disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5" /> JSON
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-auto rounded-lg border border-[#e3e8ee]">
              {previewRows.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-[13px] text-[#697386]">
                  Your generated rows will appear here.
                </div>
              ) : (
                <table className="w-full min-w-full text-left text-[12.5px]">
                  <thead className="bg-[#f6f9fc] text-[11px] font-semibold uppercase tracking-wider text-[#697386]">
                    <tr>
                      {Object.keys(previewRows[0]).map((k) => (
                        <th key={k} className="whitespace-nowrap px-3 py-2">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef1f5]">
                    {previewRows.map((r, i) => (
                      <tr key={i} className="text-[#3c4257]">
                        {Object.keys(previewRows[0]).map((k) => (
                          <td key={k} className="whitespace-nowrap px-3 py-2">
                            {String(r[k])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
