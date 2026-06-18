import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Database, Download, Sparkles, Loader2, Plus, Trash2, Settings2, Network, Package,
  Wand2, Upload, Save, Activity, FolderOpen, X,
} from "lucide-react";
import JSZip from "jszip";
import { Ribbon } from "@/components/Ribbon";
import { BusinessAuthGate } from "@/components/BusinessAuthGate";
import { useUsage, UsageBadge } from "@/components/UsageBadge";
import { useServerFn } from "@tanstack/react-start";
import { consumeBusinessUsage } from "@/lib/businessUsage.functions";
import {
  generateAISchema, generateTimeSeries,
  saveSchema, listSavedSchemas, deleteSavedSchema,
  type SavedSchema, type TimeSeriesResult,
} from "@/lib/synthetic-advanced.functions";

export const Route = createFileRoute("/business/synthetic-data")({
  head: () => ({
    meta: [
      { title: "Synthetic Data Generator — Nive AI for Business" },
      { name: "description", content: "Generate privacy-safe synthetic datasets in seconds. Custom schemas, 5000+ rows, locales, relational tables, export to CSV/JSON/SQL." },
      { property: "og:title", content: "Synthetic Data Generator — Nive AI" },
      { property: "og:description", content: "Single tables or full relational datasets. Export CSV, JSON, NDJSON, SQL or a zipped bundle." },
    ],
    links: [{ rel: "canonical", href: "/business/synthetic-data" }],
  }),
  component: () => (
    <BusinessAuthGate>
      <SyntheticDataPage />
    </BusinessAuthGate>
  ),
});

// ============ Locale-aware data pools ============

type Locale = "india" | "us" | "eu" | "global";

const POOLS: Record<Locale, {
  first: string[]; last: string[]; cities: string[]; states: string[];
  countries: string[]; companies: string[]; jobs: string[];
  phone: (r: () => number) => string; zip: (r: () => number) => string;
  currency: "INR" | "USD" | "EUR"; currencySymbol: string;
}> = {
  india: {
    first: ["Aanya","Vikram","Maya","Rohan","Priya","Arjun","Sara","Kabir","Isha","Dev","Anika","Ravi","Neha","Aarav","Diya","Yash","Riya","Zoya"],
    last: ["Sharma","Patel","Khan","Iyer","Singh","Reddy","Nair","Gupta","Mehta","Shah","Joshi","Kapoor","Rao","Verma","Bose","Chopra"],
    cities: ["Mumbai","Delhi","Bengaluru","Pune","Hyderabad","Chennai","Kolkata","Jaipur","Ahmedabad","Goa","Surat","Indore"],
    states: ["Maharashtra","Karnataka","Tamil Nadu","Telangana","Delhi","Gujarat","West Bengal","Rajasthan","Kerala","Punjab"],
    countries: ["India"],
    companies: ["Reliance Digital","Tata Group","Infosys","Wipro","Flipkart","Zomato","Paytm","Swiggy","Razorpay","BYJU'S"],
    jobs: ["Software Engineer","Product Manager","Data Analyst","UX Designer","Founder","Marketing Lead","Sales Manager","DevOps Engineer"],
    phone: (r) => `+91 ${intB(r, 70000, 99999)} ${intB(r, 10000, 99999)}`,
    zip: (r) => String(intB(r, 110001, 799999)),
    currency: "INR", currencySymbol: "₹",
  },
  us: {
    first: ["Emma","Liam","Olivia","Noah","Ava","Ethan","Sophia","Mason","Isabella","Logan","Mia","Lucas","Charlotte","Aiden","Amelia"],
    last: ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Wilson","Anderson"],
    cities: ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","Austin","Seattle","Boston"],
    states: ["NY","CA","IL","TX","AZ","PA","FL","WA","MA","GA","CO","OR"],
    countries: ["United States"],
    companies: ["Acme Corp","Globex","Initech","Umbrella","Stark Industries","Hooli","Pied Piper","Wayne Enterprises","Soylent","Cyberdyne"],
    jobs: ["Software Engineer","Product Manager","Data Scientist","Designer","CEO","CTO","Account Executive","Marketing Director"],
    phone: (r) => `+1 (${intB(r, 200, 999)}) ${intB(r, 200, 999)}-${intB(r, 1000, 9999)}`,
    zip: (r) => String(intB(r, 10001, 99950)).padStart(5, "0"),
    currency: "USD", currencySymbol: "$",
  },
  eu: {
    first: ["Lukas","Sophie","Anna","Maximilian","Marie","Felix","Emma","Paul","Mia","Leon","Hanna","Jonas","Lara","Tim","Lena"],
    last: ["Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann","Dubois","Martin","Bernard","Rossi","Bianchi"],
    cities: ["Berlin","Paris","Madrid","Rome","Amsterdam","Vienna","Brussels","Munich","Barcelona","Milan","Hamburg","Lisbon"],
    states: ["Bavaria","Île-de-France","Catalonia","Lazio","North Holland","Vienna","Brussels"],
    countries: ["Germany","France","Spain","Italy","Netherlands","Austria","Belgium","Portugal"],
    companies: ["Siemens","SAP","Volkswagen","BMW","Airbus","Spotify","Adidas","Zalando","Klarna","BNP Paribas"],
    jobs: ["Ingenieur","Product Owner","Data Engineer","Designer","Geschäftsführer","Marketing Manager","Sales Lead"],
    phone: (r) => `+49 ${intB(r, 30, 89)} ${intB(r, 1000000, 9999999)}`,
    zip: (r) => String(intB(r, 10000, 89999)),
    currency: "EUR", currencySymbol: "€",
  },
  global: {
    first: ["Alex","Sam","Jordan","Taylor","Morgan","Casey","Riley","Avery","Quinn","Skyler","River","Rowan"],
    last: ["Lee","Kim","Chen","Patel","Garcia","Müller","Silva","Khan","Tanaka","Nguyen","Ivanov","Costa"],
    cities: ["Tokyo","Seoul","Singapore","Dubai","London","Toronto","Sydney","São Paulo","Cape Town","Stockholm"],
    states: ["—"],
    countries: ["Japan","South Korea","Singapore","UAE","UK","Canada","Australia","Brazil","South Africa","Sweden"],
    companies: ["Globex","Initech","Hooli","Stark Industries","Wayne Enterprises","Soylent","Acme","Umbrella"],
    jobs: ["Engineer","PM","Designer","Analyst","Founder","Director","Lead","Manager"],
    phone: (r) => `+${intB(r, 1, 99)} ${intB(r, 100000000, 999999999)}`,
    zip: (r) => String(intB(r, 10000, 99999)),
    currency: "USD", currencySymbol: "$",
  },
};

const PRODUCTS = ["Notebook","Headphones","Coffee Mug","Backpack","Sneakers","Desk Lamp","Phone Case","Water Bottle","T-shirt","Keyboard","Monitor","Webcam","Mouse","Speaker"];
const STATUS = ["pending","paid","shipped","delivered","cancelled","refunded"];
const TICKET_STATUS = ["open","in_progress","waiting","resolved","closed"];
const PRIORITY = ["low","medium","high","urgent"];
const SUBSCRIPTION_PLANS = ["Free","Starter","Pro","Business","Enterprise"];

// ============ RNG + utils ============

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(arr: T[], r: () => number) => arr[Math.floor(r() * arr.length)];
const intB = (r: () => number, lo: number, hi: number) => Math.floor(r() * (hi - lo + 1)) + lo;
function uuid(r: () => number): string {
  const h = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) s += "-";
    s += h[Math.floor(r() * 16)];
  }
  return s;
}

// ============ Field types ============

type FieldType =
  | "id" | "uuid" | "first_name" | "last_name" | "full_name" | "username" | "email"
  | "phone" | "age" | "company" | "job_title"
  | "city" | "state" | "country" | "zip" | "street" | "lat" | "lng"
  | "amount" | "currency_inr" | "currency_usd" | "currency_eur"
  | "percent" | "rating_1_5" | "int_range"
  | "product" | "status" | "ticket_status" | "priority" | "plan_name"
  | "date" | "iso_datetime" | "boolean" | "url" | "ipv4" | "paragraph" | "tag";

type FieldConfig = {
  enumValues?: string;       // comma-separated for `tag`
  intMin?: number;
  intMax?: number;
  nullablePct?: number;      // 0-100
};

type Field = { name: string; type: FieldType; config?: FieldConfig };

const FIELD_TYPE_GROUPS: { label: string; types: FieldType[] }[] = [
  { label: "Identity", types: ["id","uuid","first_name","last_name","full_name","username","email","phone","age"] },
  { label: "Work", types: ["company","job_title"] },
  { label: "Location", types: ["city","state","country","zip","street","lat","lng"] },
  { label: "Money & numbers", types: ["amount","currency_inr","currency_usd","currency_eur","percent","rating_1_5","int_range"] },
  { label: "Commerce", types: ["product","status","ticket_status","priority","plan_name"] },
  { label: "Time & misc", types: ["date","iso_datetime","boolean","url","ipv4","paragraph","tag"] },
];

function genValue(field: Field, r: () => number, i: number, locale: Locale): string | number | boolean | null {
  const cfg = field.config ?? {};
  if (cfg.nullablePct && r() * 100 < cfg.nullablePct) return null;
  const pool = POOLS[locale];
  switch (field.type) {
    case "id": return i + 1;
    case "uuid": return uuid(r);
    case "first_name": return pick(pool.first, r);
    case "last_name": return pick(pool.last, r);
    case "full_name": return `${pick(pool.first, r)} ${pick(pool.last, r)}`;
    case "username": return `${pick(pool.first, r).toLowerCase()}_${intB(r, 1, 9999)}`;
    case "email": {
      const f = pick(pool.first, r).toLowerCase().replace(/[^a-z]/g, "");
      const l = pick(pool.last, r).toLowerCase().replace(/[^a-z]/g, "");
      return `${f}.${l}${intB(r, 1, 999)}@example.com`;
    }
    case "phone": return pool.phone(r);
    case "age": return intB(r, 18, 72);
    case "company": return pick(pool.companies, r);
    case "job_title": return pick(pool.jobs, r);
    case "city": return pick(pool.cities, r);
    case "state": return pick(pool.states, r);
    case "country": return pick(pool.countries, r);
    case "zip": return pool.zip(r);
    case "street": return `${intB(r, 1, 9999)} ${pick(["Main","Park","Oak","Pine","Maple","Cedar","Lake","Hill"], r)} ${pick(["St","Ave","Rd","Blvd","Ln"], r)}`;
    case "lat": return Math.round((r() * 180 - 90) * 1e6) / 1e6;
    case "lng": return Math.round((r() * 360 - 180) * 1e6) / 1e6;
    case "amount": return Math.round(intB(r, 99, 49999) * 100) / 100;
    case "currency_inr": return `₹${(Math.round(intB(r, 99, 99999) * 100) / 100).toFixed(2)}`;
    case "currency_usd": return `$${(Math.round(intB(r, 1, 9999) * 100) / 100).toFixed(2)}`;
    case "currency_eur": return `€${(Math.round(intB(r, 1, 9999) * 100) / 100).toFixed(2)}`;
    case "percent": return Math.round(r() * 1000) / 10;
    case "rating_1_5": return Math.round((1 + r() * 4) * 10) / 10;
    case "int_range": {
      const lo = cfg.intMin ?? 0;
      const hi = cfg.intMax ?? 100;
      return intB(r, lo, hi);
    }
    case "product": return pick(PRODUCTS, r);
    case "status": return pick(STATUS, r);
    case "ticket_status": return pick(TICKET_STATUS, r);
    case "priority": return pick(PRIORITY, r);
    case "plan_name": return pick(SUBSCRIPTION_PLANS, r);
    case "date": {
      const d = new Date(Date.now() - intB(r, 0, 365) * 86400000);
      return d.toISOString().slice(0, 10);
    }
    case "iso_datetime": {
      const d = new Date(Date.now() - intB(r, 0, 365 * 86400000));
      return d.toISOString();
    }
    case "boolean": return r() > 0.5;
    case "url": return `https://example.com/${pick(["users","orders","products","posts"], r)}/${intB(r, 1, 9999)}`;
    case "ipv4": return `${intB(r, 1, 255)}.${intB(r, 0, 255)}.${intB(r, 0, 255)}.${intB(r, 1, 254)}`;
    case "paragraph": {
      const words = ["lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do","eiusmod","tempor","incididunt","labore","magna","aliqua"];
      return Array.from({ length: intB(r, 18, 32) }, () => pick(words, r)).join(" ") + ".";
    }
    case "tag": {
      const enums = (cfg.enumValues ?? "alpha,beta,gamma").split(",").map((s) => s.trim()).filter(Boolean);
      return enums.length ? pick(enums, r) : "tag";
    }
  }
}

function generateRows(fields: Field[], count: number, seed: number, locale: Locale) {
  const r = mulberry32(seed);
  const rows: Record<string, string | number | boolean | null>[] = [];
  for (let i = 0; i < count; i++) {
    const row: Record<string, string | number | boolean | null> = {};
    for (const f of fields) row[f.name] = genValue(f, r, i, locale);
    rows.push(row);
  }
  return rows;
}

// ============ Export formats ============

function escapeCsv(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  return [keys.join(","), ...rows.map((r) => keys.map((k) => escapeCsv(r[k])).join(","))].join("\n");
}
function toNDJSON(rows: Record<string, unknown>[]): string {
  return rows.map((r) => JSON.stringify(r)).join("\n");
}
function inferSqlType(values: unknown[]): string {
  const sample = values.find((v) => v !== null && v !== undefined);
  if (typeof sample === "number") return Number.isInteger(sample) ? "BIGINT" : "NUMERIC";
  if (typeof sample === "boolean") return "BOOLEAN";
  return "TEXT";
}
function sqlEscape(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return `'${String(v).replace(/'/g, "''")}'`;
}
function toSQL(tableName: string, rows: Record<string, unknown>[]): string {
  if (!rows.length) return `-- empty table\nCREATE TABLE ${tableName} ();\n`;
  const keys = Object.keys(rows[0]);
  const types = keys.map((k) => `  ${k} ${inferSqlType(rows.map((r) => r[k]))}`).join(",\n");
  const create = `CREATE TABLE ${tableName} (\n${types}\n);`;
  const inserts = rows
    .map((r) => `INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${keys.map((k) => sqlEscape(r[k])).join(", ")});`)
    .join("\n");
  return `${create}\n\n${inserts}\n`;
}
function toMarkdown(rows: Record<string, unknown>[], limit = 50): string {
  if (!rows.length) return "_No rows_";
  const keys = Object.keys(rows[0]);
  const slice = rows.slice(0, limit);
  const header = `| ${keys.join(" | ")} |`;
  const sep = `| ${keys.map(() => "---").join(" | ")} |`;
  const body = slice.map((r) => `| ${keys.map((k) => String(r[k] ?? "")).join(" | ")} |`).join("\n");
  return [header, sep, body].join("\n") + (rows.length > limit ? `\n\n_(${rows.length - limit} more rows)_` : "");
}
function downloadBlob(name: string, content: string | Blob, mime = "text/plain") {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============ Presets ============

const PRESETS: { name: string; fields: Field[] }[] = [
  { name: "Customers", fields: [
    { name: "id", type: "id" }, { name: "name", type: "full_name" }, { name: "email", type: "email" },
    { name: "city", type: "city" }, { name: "country", type: "country" }, { name: "phone", type: "phone" }, { name: "age", type: "age" },
  ]},
  { name: "Orders", fields: [
    { name: "order_id", type: "id" }, { name: "customer", type: "full_name" },
    { name: "product", type: "product" }, { name: "amount", type: "amount" },
    { name: "status", type: "status" }, { name: "ordered_at", type: "iso_datetime" },
  ]},
  { name: "SaaS users", fields: [
    { name: "id", type: "uuid" }, { name: "username", type: "username" }, { name: "email", type: "email" },
    { name: "plan", type: "plan_name" }, { name: "is_active", type: "boolean" }, { name: "created_at", type: "iso_datetime" },
  ]},
  { name: "Subscriptions", fields: [
    { name: "id", type: "uuid" }, { name: "customer_email", type: "email" },
    { name: "plan", type: "plan_name" }, { name: "mrr", type: "currency_usd" },
    { name: "started_at", type: "date" }, { name: "active", type: "boolean" },
  ]},
  { name: "Support tickets", fields: [
    { name: "ticket_id", type: "id" }, { name: "subject", type: "paragraph" },
    { name: "reporter", type: "full_name" }, { name: "priority", type: "priority" },
    { name: "status", type: "ticket_status" }, { name: "opened_at", type: "iso_datetime" },
  ]},
  { name: "Patients", fields: [
    { name: "patient_id", type: "uuid" }, { name: "name", type: "full_name" },
    { name: "age", type: "age" }, { name: "city", type: "city" },
    { name: "phone", type: "phone" }, { name: "registered_at", type: "date" },
  ]},
  { name: "Transactions", fields: [
    { name: "txn_id", type: "uuid" }, { name: "account", type: "username" },
    { name: "amount", type: "currency_inr" }, { name: "type", type: "tag", config: { enumValues: "debit,credit,refund,fee" } },
    { name: "at", type: "iso_datetime" }, { name: "status", type: "status" },
  ]},
  { name: "Products", fields: [
    { name: "sku", type: "uuid" }, { name: "name", type: "product" },
    { name: "price", type: "currency_usd" }, { name: "stock", type: "int_range", config: { intMin: 0, intMax: 500 } },
    { name: "rating", type: "rating_1_5" }, { name: "active", type: "boolean" },
  ]},
  { name: "Employees", fields: [
    { name: "emp_id", type: "id" }, { name: "name", type: "full_name" },
    { name: "title", type: "job_title" }, { name: "company", type: "company" },
    { name: "email", type: "email" }, { name: "salary", type: "int_range", config: { intMin: 30000, intMax: 250000 } },
  ]},
];

// ============ Relational blueprints ============

type RelationalBlueprint = {
  id: string;
  name: string;
  description: string;
  tables: string[];
  generate: (size: number, seed: number, locale: Locale) => Record<string, Record<string, any>[]>;
};

const BLUEPRINTS: RelationalBlueprint[] = [
  {
    id: "saas",
    name: "SaaS · users + workspaces + subscriptions",
    description: "Users own workspaces; each workspace has one active subscription.",
    tables: ["users", "workspaces", "subscriptions"],
    generate: (size, seed, locale) => {
      const r = mulberry32(seed);
      const pool = POOLS[locale];
      const users = Array.from({ length: size }, (_, i) => ({
        id: i + 1, email: `${pick(pool.first, r).toLowerCase()}.${pick(pool.last, r).toLowerCase()}${intB(r, 1, 999)}@example.com`,
        name: `${pick(pool.first, r)} ${pick(pool.last, r)}`, created_at: new Date(Date.now() - intB(r, 0, 365) * 86400000).toISOString(),
      }));
      const workspaces: any[] = []; const subscriptions: any[] = [];
      let wId = 1, sId = 1;
      for (const u of users) {
        const n = intB(r, 1, 3);
        for (let k = 0; k < n; k++) {
          workspaces.push({ id: wId, owner_user_id: u.id, name: `${pick(pool.companies, r)} ${k + 1}`, created_at: u.created_at });
          subscriptions.push({
            id: sId, workspace_id: wId, plan: pick(SUBSCRIPTION_PLANS, r),
            mrr_usd: Math.round(intB(r, 0, 999) * 100) / 100, active: r() > 0.15,
            started_at: u.created_at,
          });
          wId++; sId++;
        }
      }
      return { users, workspaces, subscriptions };
    },
  },
  {
    id: "ecommerce",
    name: "E-commerce · customers + orders + line_items + products",
    description: "Customers place orders; each order has multiple line items linking to a product catalog.",
    tables: ["customers", "products", "orders", "line_items"],
    generate: (size, seed, locale) => {
      const r = mulberry32(seed);
      const pool = POOLS[locale];
      const productCount = Math.max(8, Math.floor(size / 5));
      const products = Array.from({ length: productCount }, (_, i) => ({
        id: i + 1, name: pick(PRODUCTS, r), price: Math.round(intB(r, 99, 9999) * 100) / 100,
        stock: intB(r, 0, 500),
      }));
      const customers = Array.from({ length: size }, (_, i) => ({
        id: i + 1, name: `${pick(pool.first, r)} ${pick(pool.last, r)}`,
        email: `${pick(pool.first, r).toLowerCase()}${intB(r, 1, 999)}@example.com`,
        city: pick(pool.cities, r), country: pick(pool.countries, r),
      }));
      const orders: any[] = []; const lineItems: any[] = [];
      let oId = 1, liId = 1;
      for (const c of customers) {
        const n = intB(r, 0, 6);
        for (let k = 0; k < n; k++) {
          const orderedAt = new Date(Date.now() - intB(r, 0, 365) * 86400000).toISOString();
          let total = 0;
          const itemsN = intB(r, 1, 5);
          const usedProducts: number[] = [];
          for (let j = 0; j < itemsN; j++) {
            const prod = products[intB(r, 0, products.length - 1)];
            if (usedProducts.includes(prod.id)) continue;
            usedProducts.push(prod.id);
            const qty = intB(r, 1, 4);
            const subtotal = Math.round(prod.price * qty * 100) / 100;
            total += subtotal;
            lineItems.push({ id: liId++, order_id: oId, product_id: prod.id, quantity: qty, subtotal });
          }
          orders.push({
            id: oId, customer_id: c.id, total_amount: Math.round(total * 100) / 100,
            status: pick(STATUS, r), ordered_at: orderedAt,
          });
          oId++;
        }
      }
      return { customers, products, orders, line_items: lineItems };
    },
  },
  {
    id: "support",
    name: "Support · tickets + agents + messages",
    description: "Agents handle tickets; each ticket has a thread of messages.",
    tables: ["agents", "tickets", "messages"],
    generate: (size, seed, locale) => {
      const r = mulberry32(seed);
      const pool = POOLS[locale];
      const agentCount = Math.max(4, Math.floor(size / 20));
      const agents = Array.from({ length: agentCount }, (_, i) => ({
        id: i + 1, name: `${pick(pool.first, r)} ${pick(pool.last, r)}`,
        email: `agent${i + 1}@example.com`, active: r() > 0.1,
      }));
      const tickets = Array.from({ length: size }, (_, i) => ({
        id: i + 1, subject: `${pick(["Cannot","Issue with","Question about","Help me","Bug in"], r)} ${pick(["billing","login","export","upload","API","dashboard"], r)}`,
        reporter_name: `${pick(pool.first, r)} ${pick(pool.last, r)}`,
        assigned_agent_id: agents[intB(r, 0, agents.length - 1)].id,
        priority: pick(PRIORITY, r), status: pick(TICKET_STATUS, r),
        opened_at: new Date(Date.now() - intB(r, 0, 180) * 86400000).toISOString(),
      }));
      const messages: any[] = []; let mId = 1;
      for (const t of tickets) {
        const n = intB(r, 1, 6);
        for (let k = 0; k < n; k++) {
          messages.push({
            id: mId++, ticket_id: t.id,
            from: k === 0 || r() > 0.5 ? "customer" : "agent",
            body: `Message ${k + 1}: ${pick(["Thanks for the update.","Could you confirm?","I tried that and it still fails.","Resolved on my end now.","Looking into it."], r)}`,
            at: new Date(Date.now() - intB(r, 0, 180) * 86400000).toISOString(),
          });
        }
      }
      return { agents, tickets, messages };
    },
  },
  {
    id: "healthcare",
    name: "Healthcare · patients + providers + appointments",
    description: "Patients book appointments with providers.",
    tables: ["patients", "providers", "appointments"],
    generate: (size, seed, locale) => {
      const r = mulberry32(seed);
      const pool = POOLS[locale];
      const providerCount = Math.max(5, Math.floor(size / 15));
      const providers = Array.from({ length: providerCount }, (_, i) => ({
        id: i + 1, name: `Dr. ${pick(pool.first, r)} ${pick(pool.last, r)}`,
        specialty: pick(["Cardiology","Pediatrics","Dermatology","GP","Orthopedics","Neurology"], r),
      }));
      const patients = Array.from({ length: size }, (_, i) => ({
        id: i + 1, name: `${pick(pool.first, r)} ${pick(pool.last, r)}`,
        age: intB(r, 1, 92), phone: pool.phone(r), city: pick(pool.cities, r),
      }));
      const appts: any[] = []; let aId = 1;
      for (const p of patients) {
        const n = intB(r, 0, 4);
        for (let k = 0; k < n; k++) {
          appts.push({
            id: aId++, patient_id: p.id, provider_id: providers[intB(r, 0, providers.length - 1)].id,
            scheduled_for: new Date(Date.now() + intB(r, -180, 180) * 86400000).toISOString(),
            status: pick(["scheduled","completed","cancelled","no_show"], r),
          });
        }
      }
      return { patients, providers, appointments: appts };
    },
  },
  {
    id: "finance",
    name: "Finance · accounts + transactions",
    description: "Bank-style accounts with a transaction ledger.",
    tables: ["accounts", "transactions"],
    generate: (size, seed, locale) => {
      const r = mulberry32(seed);
      const pool = POOLS[locale];
      const accounts = Array.from({ length: size }, (_, i) => ({
        id: i + 1, holder_name: `${pick(pool.first, r)} ${pick(pool.last, r)}`,
        account_number: String(intB(r, 100000000, 999999999)),
        balance: Math.round(intB(r, 100, 999999) * 100) / 100,
        currency: pool.currency, opened_at: new Date(Date.now() - intB(r, 0, 1825) * 86400000).toISOString().slice(0, 10),
      }));
      const txns: any[] = []; let tId = 1;
      for (const acc of accounts) {
        const n = intB(r, 3, 20);
        for (let k = 0; k < n; k++) {
          txns.push({
            id: tId++, account_id: acc.id,
            type: pick(["debit","credit","fee","refund","transfer"], r),
            amount: Math.round(intB(r, 1, 50000) * 100) / 100,
            at: new Date(Date.now() - intB(r, 0, 365) * 86400000).toISOString(),
            status: pick(["posted","pending","failed"], r),
          });
        }
      }
      return { accounts, transactions: txns };
    },
  },
];

// ============ Component ============

const FIELD_TYPES_FLAT: FieldType[] = FIELD_TYPE_GROUPS.flatMap((g) => g.types);

function SyntheticDataPage() {
  const consume = useServerFn(consumeBusinessUsage);
  const { usage, setUsage } = useUsage("synthetic");

  const [mode, setMode] = useState<"single" | "relational" | "timeseries">("single");
  const [locale, setLocale] = useState<Locale>("india");

  // Single table state
  const [fields, setFields] = useState<Field[]>(PRESETS[0].fields);
  const [count, setCount] = useState(100);
  const [seed, setSeed] = useState(42);
  const [rows, setRows] = useState<Record<string, string | number | boolean | null>[]>([]);
  const [configIdx, setConfigIdx] = useState<number | null>(null);

  // Relational state
  const [blueprintId, setBlueprintId] = useState<string>(BLUEPRINTS[0].id);
  const [relSize, setRelSize] = useState(80);
  const [relTables, setRelTables] = useState<Record<string, Record<string, any>[]>>({});

  // Time-series state
  const [tsUsers, setTsUsers] = useState(200);
  const [tsDays, setTsDays] = useState(30);
  const [tsEventTypes, setTsEventTypes] = useState("page_view, signup, activate, subscribe");
  const [tsFunnel, setTsFunnel] = useState(true);
  const [tsResult, setTsResult] = useState<TimeSeriesResult | null>(null);
  const tsGen = useServerFn(generateTimeSeries);

  // Advanced modals + saved
  const [aiOpen, setAiOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const aiGen = useServerFn(generateAISchema);
  const saveFn = useServerFn(saveSchema);
  const listFn = useServerFn(listSavedSchemas);
  const delFn = useServerFn(deleteSavedSchema);
  const [savedList, setSavedList] = useState<SavedSchema[]>([]);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!savedOpen) return;
    listFn().then(setSavedList).catch(() => {});
  }, [savedOpen, listFn]);

  const handleGenerateTimeSeries = async () => {
    setError(null);
    const eventTypes = tsEventTypes.split(",").map((s) => s.trim()).filter(Boolean);
    if (eventTypes.length < 2) { setError("At least 2 event types."); return; }
    if (usage && usage.remaining < 2) { setError(`Need 2 credits, have ${usage.remaining}.`); return; }
    setGenerating(true);
    try {
      const r = await tsGen({ data: { entity: "user", user_count: tsUsers, days: tsDays, events_per_user_max: 8, event_types: eventTypes, funnel: tsFunnel, seed } });
      setTsResult(r); setUsage(r.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setGenerating(false); }
  };

  const handleAIDescribe = async (description: string) => {
    setError(null);
    if (usage && usage.remaining < 2) throw new Error(`Need 2 credits, have ${usage.remaining}.`);
    const r = await aiGen({ data: { description } });
    setUsage(r.usage);
    setFields(r.fields.map((f) => ({ name: f.name, type: f.type as FieldType, config: f.config as any })));
    return r;
  };

  const handleSaveCurrent = async () => {
    setError(null);
    const name = saveName.trim() || `schema_${Date.now()}`;
    try {
      if (mode === "single") {
        await saveFn({ data: { name, kind: "tabular", schema_json: { fields, locale, count, seed } } });
      } else if (mode === "relational") {
        await saveFn({ data: { name, kind: "relational", schema_json: { blueprintId, relSize, locale, seed } } });
      } else {
        await saveFn({ data: { name, kind: "timeseries", schema_json: { tsUsers, tsDays, tsEventTypes, tsFunnel, seed } } });
      }
      setSaveName("");
      if (savedOpen) listFn().then(setSavedList).catch(() => {});
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
  };

  const loadSaved = (s: SavedSchema) => {
    const j = s.schema_json as any;
    if (s.kind === "tabular" && Array.isArray(j.fields)) {
      setMode("single"); setFields(j.fields); if (j.locale) setLocale(j.locale);
      if (j.count) setCount(j.count); if (j.seed) setSeed(j.seed);
    } else if (s.kind === "relational") {
      setMode("relational"); if (j.blueprintId) setBlueprintId(j.blueprintId);
      if (j.relSize) setRelSize(j.relSize); if (j.locale) setLocale(j.locale); if (j.seed) setSeed(j.seed);
    } else if (s.kind === "timeseries") {
      setMode("timeseries");
      if (j.tsUsers) setTsUsers(j.tsUsers); if (j.tsDays) setTsDays(j.tsDays);
      if (j.tsEventTypes) setTsEventTypes(j.tsEventTypes);
      if (typeof j.tsFunnel === "boolean") setTsFunnel(j.tsFunnel);
      if (j.seed) setSeed(j.seed);
    }
    setSavedOpen(false);
  };

  const handleImport = (raw: string, kind: "csv" | "sql") => {
    setError(null);
    const newFields = parseSchemaImport(raw, kind);
    if (!newFields.length) { setError("Could not detect any fields."); return; }
    setFields(newFields); setMode("single"); setImportOpen(false);
  };

  const previewRows = useMemo(() => rows.slice(0, 25), [rows]);
  const blueprint = useMemo(() => BLUEPRINTS.find((b) => b.id === blueprintId)!, [blueprintId]);

  const handleGenerateSingle = async () => {
    setError(null);
    if (usage && usage.remaining <= 0) {
      setError(`Daily limit reached (${usage.limit}/day). Top up to keep generating.`);
      return;
    }
    setGenerating(true);
    try {
      const next = await consume({ data: { tool: "synthetic", credits: 1, metadata: { mode: "single", locale } } });
      setUsage(next);
      const safeCount = Math.max(1, Math.min(5000, Math.floor(count) || 1));
      const data = generateRows(fields.filter((f) => f.name.trim().length > 0), safeCount, seed, locale);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateRelational = async () => {
    setError(null);
    if (usage && usage.remaining < 2) {
      setError(`Relational datasets cost 2 credits. You have ${usage?.remaining ?? 0} left.`);
      return;
    }
    setGenerating(true);
    try {
      const next = await consume({ data: { tool: "synthetic", credits: 2, metadata: { mode: "relational", blueprint: blueprintId, locale } } });
      setUsage(next);
      const safe = Math.max(10, Math.min(500, Math.floor(relSize) || 50));
      const tables = blueprint.generate(safe, seed, locale);
      setRelTables(tables);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const updateField = (idx: number, patch: Partial<Field>) =>
    setFields((p) => p.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  const addField = () =>
    fields.length < 24 && setFields((p) => [...p, { name: `field_${p.length + 1}`, type: "full_name" }]);
  const removeField = (idx: number) => setFields((p) => p.filter((_, i) => i !== idx));

  const downloadRelationalZip = async () => {
    const zip = new JSZip();
    let combinedSql = `-- ${blueprint.name}\n-- Generated by Nive AI for Business\n\n`;
    for (const [table, data] of Object.entries(relTables)) {
      zip.file(`${table}.csv`, toCSV(data));
      zip.file(`${table}.json`, JSON.stringify(data, null, 2));
      combinedSql += toSQL(table, data) + "\n";
    }
    zip.file("schema-and-data.sql", combinedSql);
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(`${blueprintId}-dataset-${Date.now()}.zip`, blob, "application/zip");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-[#0a2540]"
      style={{ fontFamily: "'Inter', 'Sohne', system-ui, -apple-system, sans-serif" }}>
      <Ribbon />

      <header className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/business" className="text-[22px] font-bold tracking-tight text-[#0a2540]">
          nive<span className="ml-1 text-[#635bff]">/business</span>
        </Link>
        <div className="flex items-center gap-3">
          <UsageBadge usage={usage} onTopupSuccess={(u) => { setUsage(u); setError(null); }} />
          <Link to="/business" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0a2540]/70 transition-colors hover:text-[#635bff]">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1240px] px-6 pb-24 pt-6 sm:px-10 sm:pt-10">
        <div className="mb-6 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#635bff]/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#635bff]">
            <Database className="h-3.5 w-3.5" /> Synthetic Data
          </div>
          <h1 className="text-[34px] font-bold leading-[1.05] tracking-tight text-[#0a2540] sm:text-[44px]">
            Custom schemas, relational datasets, real exports.
          </h1>
          <p className="mt-3 text-[15px] text-[#425466]">
            32+ field types · 4 locales · up to 5000 rows · CSV / JSON / NDJSON / SQL / Markdown ·
            relational blueprints with valid foreign keys.
          </p>
        </div>

        {/* Mode + locale */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-[#f6f9fc] p-1 ring-1 ring-[#e3e8ee]">
            <button onClick={() => setMode("single")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-all ${mode === "single" ? "bg-white text-[#635bff] shadow-sm" : "text-[#697386] hover:text-[#0a2540]"}`}>
              <Package className="h-3.5 w-3.5" /> Single table
            </button>
            <button onClick={() => setMode("relational")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-all ${mode === "relational" ? "bg-white text-[#635bff] shadow-sm" : "text-[#697386] hover:text-[#0a2540]"}`}>
              <Network className="h-3.5 w-3.5" /> Relational <span className="ml-1 rounded-sm bg-[#635bff]/10 px-1 text-[10px] text-[#635bff]">2c</span>
            </button>
            <button onClick={() => setMode("timeseries")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-all ${mode === "timeseries" ? "bg-white text-[#635bff] shadow-sm" : "text-[#697386] hover:text-[#0a2540]"}`}>
              <Activity className="h-3.5 w-3.5" /> Time-series <span className="ml-1 rounded-sm bg-[#635bff]/10 px-1 text-[10px] text-[#635bff]">2c</span>
            </button>
          </div>
          <div className="ml-2 flex items-center gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#697386]">Locale</span>
            <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)} className="rounded-md border border-[#e3e8ee] bg-white px-2.5 py-1.5 text-[13px] text-[#0a2540]">
              <option value="india">India</option><option value="us">United States</option>
              <option value="eu">Europe</option><option value="global">Global</option>
            </select>
          </div>
          <div className="ml-auto flex flex-wrap gap-1.5">
            <button onClick={() => setAiOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12px] font-semibold hover:border-[#635bff] hover:text-[#635bff]">
              <Wand2 className="h-3.5 w-3.5" /> AI schema <span className="rounded-sm bg-[#635bff]/10 px-1 text-[10px] text-[#635bff]">2c</span>
            </button>
            <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12px] font-semibold hover:border-[#635bff] hover:text-[#635bff]">
              <Upload className="h-3.5 w-3.5" /> Import CSV/SQL
            </button>
            <button onClick={() => setSavedOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12px] font-semibold hover:border-[#635bff] hover:text-[#635bff]">
              <FolderOpen className="h-3.5 w-3.5" /> Saved
            </button>
            <input value={saveName} onChange={(e) => setSaveName(e.target.value.slice(0, 80))} placeholder="schema name"
              className="rounded-md border border-[#e3e8ee] bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-[#635bff]" />
            <button onClick={handleSaveCurrent} className="inline-flex items-center gap-1.5 rounded-md bg-[#0a2540] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1a3550]">
              <Save className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </div>

        {mode === "single" ? (
          <>
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="self-center text-[12px] font-semibold uppercase tracking-wider text-[#697386]">Presets:</span>
              {PRESETS.map((p) => (
                <button key={p.name} onClick={() => setFields(p.fields)}
                  className="rounded-full border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#0a2540] transition-all hover:border-[#635bff] hover:text-[#635bff]">
                  {p.name}
                </button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
              <div className="rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(50,50,93,0.08)] ring-1 ring-[#e3e8ee]">
                <h2 className="text-[16px] font-semibold">Schema <span className="text-[12px] font-normal text-[#697386]">({fields.length}/24 fields)</span></h2>

                <div className="mt-4 space-y-2">
                  {fields.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input value={f.name}
                        onChange={(e) => updateField(i, { name: e.target.value.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40) })}
                        className="w-[40%] rounded-md border border-[#e3e8ee] bg-white px-2 py-1.5 text-[12.5px] text-[#0a2540] outline-none focus:border-[#635bff]"
                        placeholder="field_name" />
                      <select value={f.type} onChange={(e) => updateField(i, { type: e.target.value as FieldType, config: {} })}
                        className="flex-1 rounded-md border border-[#e3e8ee] bg-white px-2 py-1.5 text-[12.5px] text-[#0a2540] outline-none focus:border-[#635bff]">
                        {FIELD_TYPE_GROUPS.map((g) => (
                          <optgroup key={g.label} label={g.label}>
                            {g.types.map((t) => <option key={t} value={t}>{t}</option>)}
                          </optgroup>
                        ))}
                      </select>
                      <button type="button" onClick={() => setConfigIdx(i)} title="Field options"
                        className="rounded-md p-1.5 text-[#697386] hover:bg-[#f6f9fc] hover:text-[#635bff]">
                        <Settings2 className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => removeField(i)} disabled={fields.length <= 1}
                        className="rounded-md p-1.5 text-[#697386] hover:bg-[#f6f9fc] hover:text-[#ff5a36] disabled:opacity-30">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {fields.length < 24 && (
                    <button onClick={addField}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[#cfd7df] py-2 text-[13px] font-medium text-[#635bff] hover:bg-[#f6f9fc]">
                      <Plus className="h-3.5 w-3.5" /> Add field
                    </button>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[12px] font-medium text-[#697386]">Rows (1–5000)</span>
                    <input type="number" min={1} max={5000} value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="mt-1 w-full rounded-md border border-[#e3e8ee] bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[#635bff]" />
                  </label>
                  <label className="block">
                    <span className="text-[12px] font-medium text-[#697386]">Seed</span>
                    <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))}
                      className="mt-1 w-full rounded-md border border-[#e3e8ee] bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[#635bff]" />
                  </label>
                </div>

                <button onClick={handleGenerateSingle} disabled={generating}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#635bff] py-2.5 text-[14px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.25)] transition-all hover:bg-[#5048d6] disabled:opacity-60">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate dataset (1 credit)
                </button>
                {error && <p className="mt-3 rounded-md bg-[#fff1f0] px-3 py-2 text-[12.5px] text-[#c0392b]">{error}</p>}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(50,50,93,0.08)] ring-1 ring-[#e3e8ee]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[16px] font-semibold">Results</h2>
                    <p className="mt-0.5 text-[12px] text-[#697386]">
                      {rows.length ? `${rows.length} rows · previewing first ${previewRows.length}` : "No data yet — generate to see preview."}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <ExportBtn label="CSV" disabled={!rows.length} onClick={() => downloadBlob(`synthetic-${Date.now()}.csv`, toCSV(rows), "text/csv")} />
                    <ExportBtn label="JSON" disabled={!rows.length} onClick={() => downloadBlob(`synthetic-${Date.now()}.json`, JSON.stringify(rows, null, 2), "application/json")} />
                    <ExportBtn label="NDJSON" disabled={!rows.length} onClick={() => downloadBlob(`synthetic-${Date.now()}.ndjson`, toNDJSON(rows), "application/x-ndjson")} />
                    <ExportBtn label="SQL" disabled={!rows.length} onClick={() => {
                      const t = prompt("Table name?", "my_table") ?? "my_table";
                      downloadBlob(`${t}-${Date.now()}.sql`, toSQL(t.replace(/[^a-zA-Z0-9_]/g, "_"), rows), "application/sql");
                    }} />
                    <ExportBtn label="MD" disabled={!rows.length} onClick={() => downloadBlob(`synthetic-${Date.now()}.md`, toMarkdown(rows), "text/markdown")} />
                  </div>
                </div>

                <div className="mt-4 overflow-auto rounded-lg border border-[#e3e8ee]">
                  {previewRows.length === 0 ? (
                    <div className="flex h-64 items-center justify-center text-[13px] text-[#697386]">Your generated rows will appear here.</div>
                  ) : (
                    <table className="w-full min-w-full text-left text-[12.5px]">
                      <thead className="bg-[#f6f9fc] text-[11px] font-semibold uppercase tracking-wider text-[#697386]">
                        <tr>{Object.keys(previewRows[0]).map((k) => <th key={k} className="whitespace-nowrap px-3 py-2">{k}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-[#eef1f5]">
                        {previewRows.map((r, i) => (
                          <tr key={i} className="text-[#3c4257]">
                            {Object.keys(previewRows[0]).map((k) => (
                              <td key={k} className="whitespace-nowrap px-3 py-2">{r[k] === null ? <em className="text-[#a3acb9]">null</em> : String(r[k])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          // Relational mode
          <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
            <div className="rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(50,50,93,0.08)] ring-1 ring-[#e3e8ee]">
              <h2 className="text-[16px] font-semibold">Relational blueprint</h2>
              <p className="mt-1 text-[12px] text-[#697386]">Generates 2–4 linked tables with valid foreign keys.</p>

              <div className="mt-4 space-y-2">
                {BLUEPRINTS.map((b) => (
                  <button key={b.id} onClick={() => setBlueprintId(b.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      blueprintId === b.id ? "border-[#635bff] bg-[#635bff]/5" : "border-[#e3e8ee] bg-white hover:border-[#635bff]"
                    }`}>
                    <div className="text-[13.5px] font-semibold text-[#0a2540]">{b.name}</div>
                    <div className="mt-0.5 text-[12px] text-[#697386]">{b.description}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {b.tables.map((t) => (
                        <span key={t} className="rounded-sm bg-[#f6f9fc] px-1.5 py-0.5 text-[10.5px] font-mono text-[#425466]">{t}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[12px] font-medium text-[#697386]">Root rows (10–500)</span>
                  <input type="number" min={10} max={500} value={relSize}
                    onChange={(e) => setRelSize(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-[#e3e8ee] bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[#635bff]" />
                </label>
                <label className="block">
                  <span className="text-[12px] font-medium text-[#697386]">Seed</span>
                  <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-[#e3e8ee] bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[#635bff]" />
                </label>
              </div>

              <button onClick={handleGenerateRelational} disabled={generating}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#635bff] py-2.5 text-[14px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.25)] transition-all hover:bg-[#5048d6] disabled:opacity-60">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
                Generate relational set (2 credits)
              </button>
              {error && <p className="mt-3 rounded-md bg-[#fff1f0] px-3 py-2 text-[12.5px] text-[#c0392b]">{error}</p>}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(50,50,93,0.08)] ring-1 ring-[#e3e8ee]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold">Tables</h2>
                  <p className="mt-0.5 text-[12px] text-[#697386]">
                    {Object.keys(relTables).length ? `${Object.keys(relTables).length} tables generated` : "Pick a blueprint and generate."}
                  </p>
                </div>
                <button type="button" onClick={downloadRelationalZip} disabled={!Object.keys(relTables).length}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#635bff] px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.25)] transition-all hover:bg-[#5048d6] disabled:opacity-40">
                  <Download className="h-3.5 w-3.5" /> Download .zip (CSV + JSON + SQL)
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {Object.entries(relTables).map(([table, data]) => (
                  <div key={table}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#0a2540]">
                        {table} <span className="ml-1 text-[#697386]">({data.length} rows)</span>
                      </h3>
                    </div>
                    <div className="overflow-auto rounded-lg border border-[#e3e8ee]">
                      {data.length === 0 ? (
                        <div className="p-3 text-[12px] text-[#697386]">empty</div>
                      ) : (
                        <table className="w-full text-left text-[12px]">
                          <thead className="bg-[#f6f9fc] text-[10.5px] font-semibold uppercase text-[#697386]">
                            <tr>{Object.keys(data[0]).map((k) => <th key={k} className="whitespace-nowrap px-2.5 py-1.5">{k}</th>)}</tr>
                          </thead>
                          <tbody className="divide-y divide-[#eef1f5]">
                            {data.slice(0, 6).map((r, i) => (
                              <tr key={i} className="text-[#3c4257]">
                                {Object.keys(data[0]).map((k) => <td key={k} className="whitespace-nowrap px-2.5 py-1.5">{String(r[k] ?? "")}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                ))}
                {!Object.keys(relTables).length && (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[#e3e8ee] text-[13px] text-[#697386]">
                    Your linked tables will appear here.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Field config modal */}
      {configIdx !== null && (
        <FieldConfigModal
          field={fields[configIdx]}
          onClose={() => setConfigIdx(null)}
          onSave={(patch) => { updateField(configIdx, patch); setConfigIdx(null); }}
        />
      )}
    </div>
  );
}

function ExportBtn({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#0a2540] transition-all hover:border-[#635bff] hover:text-[#635bff] disabled:opacity-40">
      <Download className="h-3 w-3" /> {label}
    </button>
  );
}

function FieldConfigModal({ field, onClose, onSave }: {
  field: Field; onClose: () => void; onSave: (patch: Partial<Field>) => void;
}) {
  const [config, setConfig] = useState<FieldConfig>(field.config ?? {});
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a2540]/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <h3 className="text-[16px] font-bold tracking-tight text-[#0a2540]">Field options · {field.name}</h3>
        <p className="mt-1 text-[12px] text-[#697386]">Type: {field.type}</p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[12px] font-medium text-[#697386]">Nullable %</span>
            <input type="number" min={0} max={100} value={config.nullablePct ?? 0}
              onChange={(e) => setConfig({ ...config, nullablePct: Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-[#e3e8ee] px-2.5 py-1.5 text-[13px]" />
          </label>

          {field.type === "int_range" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[12px] font-medium text-[#697386]">Min</span>
                <input type="number" value={config.intMin ?? 0}
                  onChange={(e) => setConfig({ ...config, intMin: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-[#e3e8ee] px-2.5 py-1.5 text-[13px]" />
              </label>
              <label className="block">
                <span className="text-[12px] font-medium text-[#697386]">Max</span>
                <input type="number" value={config.intMax ?? 100}
                  onChange={(e) => setConfig({ ...config, intMax: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-[#e3e8ee] px-2.5 py-1.5 text-[13px]" />
              </label>
            </div>
          )}

          {field.type === "tag" && (
            <label className="block">
              <span className="text-[12px] font-medium text-[#697386]">Allowed values (comma-separated)</span>
              <input value={config.enumValues ?? ""} placeholder="alpha,beta,gamma"
                onChange={(e) => setConfig({ ...config, enumValues: e.target.value })}
                className="mt-1 w-full rounded-md border border-[#e3e8ee] px-2.5 py-1.5 text-[13px]" />
            </label>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-[13px] font-medium text-[#697386] hover:bg-[#f6f9fc]">Cancel</button>
          <button onClick={() => onSave({ config })} className="rounded-md bg-[#635bff] px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[#5048d6]">Save</button>
        </div>
      </div>
    </div>
  );
}

// Silence unused warning (kept for parity with field type list ordering)
void FIELD_TYPES_FLAT;
