import { Link } from "@tanstack/react-router";
import { C, H2, H3, Note, OL, P, Pre, Table, UL } from "@/lib/docs-ui";

/** Body content for every documentation page, keyed by slug. */
export const DOC_BODIES: Record<string, () => React.ReactNode> = {
  overview: () => (
    <>
      <P>
        Nive AI is an ecosystem, not a single chatbot. One account unlocks a coding copilot, a
        social manager, a business suite and a set of focused studios that each solve one job
        properly. Everything runs on the same edge stack, the same auth and the same credit pool.
      </P>
      <H2>The four surfaces</H2>
      <Table
        head={["Surface", "Where", "Use it for"]}
        rows={[
          ["Code Studio", <C key="a">/code</C>, "Multi-file code generation with live preview"],
          ["Social Manager", <C key="b">/social</C>, "Post planning, captions, hashtags, calendar"],
          ["Business Suite", <C key="c">/business</C>, "Marketing modes, synthetic data, usage"],
          ["Studios", <C key="d">/voice /design /automations /agents /knowledge /seo /analyst /support</C>, "Single-purpose AI workspaces"],
        ]}
      />
      <H2>Which tool should I open?</H2>
      <UL>
        <li><strong>I need working code</strong> — Code Studio.</li>
        <li><strong>I need words that sell</strong> — Marketing Suite, or Social Manager for feeds.</li>
        <li><strong>I need fake-but-realistic data</strong> — Synthetic Data.</li>
        <li><strong>I have a document and questions</strong> — Docs &amp; Knowledge Agent.</li>
        <li><strong>I have numbers</strong> — Data Analyst, or SEO &amp; Analytics for traffic.</li>
        <li><strong>I have tickets</strong> — Support &amp; Email Agent.</li>
        <li><strong>I want to repeat a process</strong> — Automations, then freeze it as a Custom Agent.</li>
      </UL>
      <H2>Design principles</H2>
      <UL>
        <li><strong>Deliverables, not chat.</strong> Every tool returns something you can copy, download or paste into a repo.</li>
        <li><strong>Grounded by default.</strong> Tools that read your input are told to quote it and to say when something is not covered.</li>
        <li><strong>Your data stays yours.</strong> Prompts and outputs are never used for model training.</li>
        <li><strong>One brief flows through.</strong> Output from one tool is designed to be input for the next.</li>
      </UL>
      <Note tone="ok">
        New here? <Link to="/docs/$slug" params={{ slug: "quickstart" }} className="underline">Start with the Quickstart</Link>.
      </Note>
    </>
  ),

  quickstart: () => (
    <>
      <H2>1. Create an account</H2>
      <P>
        Go to <Link to="/auth" search={{ redirect: undefined }} className="underline">/auth</Link> and sign up with email or Google.
        Email sign-ups require confirmation — the link lands in your inbox within a minute.
        Anonymous sign-in is disabled, so every action is attributable to a real account.
      </P>
      <H2>2. Ship your first output</H2>
      <OL>
        <li>Open <Link to="/code" className="underline">Code Studio</Link>.</li>
        <li>Pick a preset (Web, iOS, ESP32, Python) or type free-form.</li>
        <li>Send the prompt and watch the response stream into a file tree.</li>
        <li>Open the preview pane for web output, or copy individual files.</li>
      </OL>
      <Pre>{`Build a React counter with Tailwind, a dark-mode toggle
and localStorage persistence. Include a test file.`}</Pre>
      <H2>3. Try a studio</H2>
      <P>
        Each studio takes one input box and a mode selector. A good first run: paste a CSV into{" "}
        <Link to="/analyst" className="underline">Data Analyst</Link> and run <strong>Insights</strong>,
        or paste a spec into <Link to="/knowledge" className="underline">Docs &amp; Knowledge</Link>{" "}
        and run <strong>Executive summary</strong>.
      </P>
      <H2>4. Chain it</H2>
      <P>
        Once a single tool works, open <Link to="/automations" className="underline">Automations</Link>{" "}
        and chain the steps: brief → copy → SEO → schedule → report. Each step receives the previous
        step's output as context.
      </P>
      <Note>
        Keyboard: <C>⌘K</C> / <C>Ctrl+K</C> opens the command palette in Code Studio,{" "}
        <C>Enter</C> sends, <C>Shift+Enter</C> adds a newline, <C>Esc</C> stops streaming.
      </Note>
    </>
  ),

  accounts: () => (
    <>
      <H2>Sign-in methods</H2>
      <UL>
        <li><strong>Email + password</strong> — confirmation email required before first use.</li>
        <li><strong>Google</strong> — managed one-click sign-in, no password to manage.</li>
        <li><strong>Apple</strong> — Sign in with Apple, including Hide My Email addresses.</li>
      </UL>
      <P>
        Sessions are stored by the auth client and refreshed automatically. When Nive is embedded in
        an iframe and the browser partitions third-party storage, Nive falls back to in-memory
        storage for the session — you stay signed in for that tab but not across reloads. Embedded
        windows also block provider popups; the sign-in screen offers an "Open in new tab" action
        when that happens.
      </P>
      <H2>Managing connected logins</H2>
      <P>
        Open <Link to="/account" className="underline">Account settings</Link> to see which providers
        are connected, connect a missing one, or unlink a provider you no longer use. At least one
        sign-in method must stay connected, so connect a second provider before unlinking the first.
      </P>
      <H2>Password reset</H2>
      <OL>
        <li>On <Link to="/auth" search={{ redirect: undefined }} className="underline">/auth</Link>, choose "Forgot password".</li>
        <li>Open the recovery email and follow the link back to the app.</li>
        <li>Set a new password; all other sessions keep working until they expire.</li>
      </OL>

      <H2>What is stored against your account</H2>
      <Table
        head={["Data", "Why", "Deleted with account"]}
        rows={[
          ["Email + auth identity", "Sign-in", "Yes"],
          ["Conversations & saved schemas", "Your work history", "Yes"],
          ["Brand profile", "Consistent tone across tools", "Yes"],
          ["Usage counters", "Daily credit limits", "Yes"],
          ["Payment records", "Legal / accounting retention", "Retained as required by law"],
        ]}
      />
      <H2>Deleting your account</H2>
      <P>
        Email <a href="mailto:support@nive-ai.co.in" className="underline">support@nive-ai.co.in</a>{" "}
        from the registered address. Deletion removes your workspace data within 30 days, except
        records we must retain for tax and accounting purposes.
      </P>
    </>
  ),

  credits: () => (
    <>
      <P>
        Credits are a daily allowance, not a wallet — they reset at midnight UTC and do not roll
        over. Heavier modes cost more because they call the model multiple times or generate much
        longer output.
      </P>
      <H2>Free tier</H2>
      <Table
        head={["Area", "Daily credits", "Notes"]}
        rows={[
          ["Code Studio", "Generous free usage", "Rate limited per minute, not per credit"],
          ["Marketing Suite", "30", "1-3 credits per mode"],
          ["Synthetic Data", "40", "Scales with row count"],
          ["Studios (voice, design, SEO, analyst, support, knowledge)", "Shared pool", "1-2 credits per run"],
        ]}
      />
      <H2>Growth plan</H2>
      <UL>
        <li>2× daily limits across every Business tool and studio.</li>
        <li>Priority model routing during peak hours.</li>
        <li>30-day access from the moment of purchase. No auto-renew.</li>
      </UL>
      <H2>Reading your usage</H2>
      <P>
        <Link to="/business/usage" className="underline">/business/usage</Link> shows per-tool burn
        for the current day, your remaining allowance, and the time of the next reset. The badge in
        the app header mirrors the same numbers.
      </P>
      <Note tone="warn">
        Running out mid-launch? Credits reset on a UTC clock, so 05:30 IST is your rollover. Plan
        large synthetic-data batches just after reset.
      </Note>
    </>
  ),

  "code-studio": () => (
    <>
      <P>
        Code Studio is tuned for real deliverables. It streams multi-file responses, parses them
        into a browsable tree and renders web output in a sandboxed preview.
      </P>
      <H2>Presets</H2>
      <Table
        head={["Preset", "Targets", "What changes"]}
        rows={[
          ["Web", "React + Tailwind", "Component structure, accessibility, responsive defaults"],
          ["iOS", "Swift / SwiftUI", "MVVM structure, previews, no UIKit unless asked"],
          ["Embedded", "ESP32 / Arduino", "Pin maps, non-blocking loops, memory notes"],
          ["Python / ML", "Python 3, numpy, sklearn", "Reproducible seeds, requirements list"],
        ]}
      />
      <H2>Working with output</H2>
      <UL>
        <li><strong>File tree</strong> — every fenced block with a path comment becomes a file.</li>
        <li><strong>Live preview</strong> — HTML/React output runs in a sandboxed iframe.</li>
        <li><strong>Copy / download</strong> — per file or the whole set.</li>
        <li><strong>Conversations</strong> — persisted per user; rename, delete, switch from the sidebar.</li>
        <li><strong>Attachments</strong> — paste images and text files as context.</li>
        <li><strong>Voice input</strong> — where the browser supports SpeechRecognition.</li>
      </UL>
      <H2>Prompting that works</H2>
      <OL>
        <li>State the stack and the constraint in the first sentence.</li>
        <li>Ask for the file layout you want, not just the feature.</li>
        <li>Iterate in small diffs — "change only the reducer" beats "redo it".</li>
        <li>Paste the exact error text when fixing; do not paraphrase.</li>
      </OL>
      <Pre>{`Refactor src/hooks/useCart.ts to use a reducer.
Keep the public API identical. Return only that file.`}</Pre>
    </>
  ),

  social: () => (
    <>
      <P>
        Social Manager turns one idea into a week of posts that sound like the same brand across
        every platform.
      </P>
      <H2>What it produces</H2>
      <UL>
        <li>Hook variants ranked by scroll-stopping power.</li>
        <li>Platform-native captions (length, tone and emoji density per network).</li>
        <li>Hashtag sets split into broad / niche / branded.</li>
        <li>A posting calendar with times in your timezone.</li>
        <li>Repurposing suggestions: one long asset → many short ones.</li>
      </UL>
      <H2>Workflow</H2>
      <OL>
        <li>Describe the campaign or paste the source asset (blog, launch note, transcript).</li>
        <li>Pick the platforms you actually publish to.</li>
        <li>Generate, then edit inline — drafts persist in your browser.</li>
        <li>Export the calendar and hand it to whoever schedules.</li>
      </OL>
      <Note>
        Pair this with <Link to="/docs/$slug" params={{ slug: "marketing" }} className="underline">Marketing Suite</Link>{" "}
        brand voice so captions match your landing-page tone.
      </Note>
    </>
  ),

  marketing: () => (
    <>
      <P>19 focused generators with structured output, copy and download actions.</P>
      <H2>All modes</H2>
      <Table
        head={["Mode", "Credits", "Output"]}
        rows={[
          ["Quick Copy", "1", "Headline, subhead, CTA"],
          ["Full Campaign Pack", "3", "Positioning, channels, assets"],
          ["SEO Blog Writer", "3", "Long-form post with metas"],
          ["Marketing Strategy", "2", "90-day plan"],
          ["Hero Wireframe", "2", "Section-by-section hero spec"],
          ["Competitor + SEO", "3", "Gap analysis"],
          ["Email Drip", "3", "5-email sequence"],
          ["Ad Pack", "2", "Search + social ad variants"],
          ["Landing HTML", "3", "Single-file HTML page"],
          ["Social Calendar (30d)", "3", "CSV-exportable calendar"],
          ["Video / Reels Script", "2", "Shot list + VO"],
          ["Press Release", "2", "TXT + HTML"],
          ["Cold Outreach", "3", "Sequenced emails"],
          ["Brand Voice Guidelines", "2", "Do / don't rules"],
          ["Personas", "2", "3-4 buyer personas"],
          ["A/B Variants", "1", "Test-ready variants"],
          ["SEO Meta Pack", "2", "Titles + descriptions"],
          ["Pricing Copy", "2", "Tier names and value lines"],
          ["Case Study", "3", "Markdown case study"],
        ]}
      />
      <H2>Brand voice memory</H2>
      <P>
        Save tone, do/don't lists and audience once. Every mode reads the profile automatically, so
        the fifth asset sounds like the first. Update it any time — nothing is regenerated
        retroactively.
      </P>
      <H2>Exports</H2>
      <UL>
        <li>Social Calendar → CSV</li>
        <li>Press Release → <C>.txt</C> and <C>.html</C></li>
        <li>Case Study → Markdown</li>
        <li>Landing HTML → single-file HTML</li>
      </UL>
    </>
  ),

  "synthetic-data": () => (
    <>
      <P>
        Realistic tabular, relational and time-series data for demos, tests and training — with no
        real records involved.
      </P>
      <H2>Field types</H2>
      <P>
        32+ generators across identity (names, gender, age), contact (email, phone), geography
        (address, city, state, postcode, country, lat/long), commerce (currency, price, SKU,
        category), temporal (date, datetime, timestamp, duration), technical (UUID, IP, MAC, URL,
        user agent, hash) and text (word, sentence, paragraph, enum, boolean).
      </P>
      <H2>Locales</H2>
      <Table
        head={["Locale", "Names", "Phone", "Address"]}
        rows={[
          ["India", "Regional first/last names", "+91 10-digit", "PIN codes, states"],
          ["US", "US census-style", "+1 NPA-NXX", "ZIP, states"],
          ["EU", "Mixed European", "Country codes", "Postcodes"],
          ["Global", "Mixed", "E.164", "Generic"],
        ]}
      />
      <H2>Relational blueprints</H2>
      <UL>
        <li><strong>SaaS</strong> — users, workspaces, subscriptions, events.</li>
        <li><strong>E-commerce</strong> — customers, products, orders, order_items.</li>
        <li><strong>CRM</strong> — accounts, contacts, deals, activities.</li>
        <li><strong>Analytics</strong> — sessions, pageviews, conversions.</li>
        <li><strong>Support</strong> — tickets, messages, agents, SLAs.</li>
      </UL>
      <P>Foreign keys stay consistent across tables and export as a ZIP with one file per table.</P>
      <H2>Getting a schema in</H2>
      <OL>
        <li><strong>AI schema</strong> — describe the dataset in English, get a validated schema.</li>
        <li><strong>CSV header import</strong> — paste a header row, Nive infers types.</li>
        <li><strong>SQL DDL import</strong> — paste <C>CREATE TABLE</C> and keep your column names.</li>
        <li><strong>Saved schemas</strong> — private per user, reusable across runs.</li>
      </OL>
      <H2>Exports</H2>
      <P>CSV, JSON and SQL <C>INSERT</C> statements. Up to 5,000 rows per generation.</P>
    </>
  ),

  voice: () => (
    <>
      <P>
        Speak a messy brief; get a clean deliverable. Voice Agents uses the browser's
        SpeechRecognition API, so nothing is uploaded until you press generate.
      </P>
      <H2>Output types</H2>
      <Table
        head={["Output", "Returns"]}
        rows={[
          ["Code", "Short plan plus runnable code with file paths"],
          ["Marketing copy", "Headline, subhead, 3 body variants, CTA"],
          ["Call script", "Opener, discovery, objection handles, close"],
          ["Structured notes", "Summary, decisions, action items, open questions"],
        ]}
      />
      <H2>Tips</H2>
      <UL>
        <li>Speak the constraint first — the model weights early context heavily.</li>
        <li>Use the context field for anything you don't want to say out loud.</li>
        <li>Browser support varies; Chrome and Edge are the most reliable.</li>
        <li>You can always type or paste a transcript instead of speaking.</li>
      </UL>
    </>
  ),

  design: () => (
    <>
      <P>
        Design Studio commits to one direction instead of hedging. Every concept comes back with
        values you can paste straight into code.
      </P>
      <H2>What a concept contains</H2>
      <UL>
        <li><strong>Name, tagline, vibe</strong> — the one-line direction.</li>
        <li><strong>Palette</strong> — 5-6 colours with hex values and stated usage.</li>
        <li><strong>Typography</strong> — real Google Font pairing plus rationale.</li>
        <li><strong>Hero</strong> — headline, subhead, CTA and art direction.</li>
        <li><strong>Sections</strong> — 5-7 page sections with purpose and layout.</li>
        <li><strong>Components</strong> — the reusable pieces to build first.</li>
        <li><strong>CSS tokens</strong> — a ready-to-paste <C>:root</C> block.</li>
      </UL>
      <Pre>{`:root {
  --brand: #0a7c66;
  --surface: #f6f9fc;
  --ink: #0a2540;
}`}</Pre>
      <Note>
        Feed your saved brand voice into the brief so new concepts stay consistent with what you
        already shipped.
      </Note>
    </>
  ),

  automations: () => (
    <>
      <P>
        Automations chain Nive steps so each one reads the previous output. It's the difference
        between four prompts and one process.
      </P>
      <H2>Available steps</H2>
      <Table
        head={["Step", "Consumes", "Produces"]}
        rows={[
          ["Brief", "Raw idea", "Objective, audience, message, metric"],
          ["Copy", "Brief", "Headline, subhead, 3 posts"],
          ["SEO pass", "Copy", "Keywords, metas, internal links"],
          ["Email", "Copy", "Launch email with subject options"],
          ["Schedule", "Copy", "7-day posting table"],
          ["QA review", "Everything prior", "Prioritised fix list"],
          ["Report", "Everything prior", "KPIs and weekly template"],
        ]}
      />
      <H2>Building a workflow</H2>
      <OL>
        <li>Write the brief once at the top.</li>
        <li>Add steps in the order you'd do them manually.</li>
        <li>Run — each step waits for the previous output and inherits it.</li>
        <li>Save the workflow; it persists in your browser for re-runs.</li>
      </OL>
      <Note tone="warn">
        Long chains multiply credits. Test with two steps before running a seven-step workflow.
      </Note>
    </>
  ),

  agents: () => (
    <>
      <P>
        A Custom Agent is a frozen prompt: instructions, brand context and enabled skills, saved
        under a name your team can run without rewriting anything.
      </P>
      <H2>Anatomy</H2>
      <UL>
        <li><strong>Name</strong> — how it's referred to in conversation.</li>
        <li><strong>Instructions</strong> — the operating rules; be specific about format.</li>
        <li><strong>Brand context</strong> — facts the agent must respect.</li>
        <li><strong>Skills</strong> — up to 8 tags that bias behaviour (e.g. Code Reviewer, Copy Chief).</li>
      </UL>
      <H2>Writing good instructions</H2>
      <OL>
        <li>State the output format explicitly ("always return a markdown table").</li>
        <li>List what it must never do.</li>
        <li>Give one worked example — examples beat adjectives.</li>
        <li>Keep it under ~400 words; longer prompts drift.</li>
      </OL>
      <P>Each agent keeps its own chat history so context accumulates per agent, not globally.</P>
    </>
  ),

  knowledge: () => (
    <>
      <P>
        Paste a document; get something usable out of it. Every mode is instructed to stay inside
        the supplied material and to say "not covered in this document" rather than guess.
      </P>
      <H2>Modes</H2>
      <Table
        head={["Mode", "Best for"]}
        rows={[
          ["Executive summary", "A 40-page PDF nobody read"],
          ["Grounded Q&A", "Answering with quoted source lines"],
          ["Internal wiki page", "Turning tribal knowledge into a page"],
          ["FAQ generator", "Seeding a help centre"],
          ["Onboarding guide", "Day 1 / Week 1 / Month 1 plans"],
          ["Training flashcards", "Enablement and quizzes"],
        ]}
      />
      <H2>Input limits</H2>
      <P>
        Up to roughly 20,000 characters per run. For longer material, split by chapter and run each
        section, then summarise the summaries.
      </P>
      <Note tone="ok">
        Grounded Q&amp;A quotes the supporting line for every answer, so you can verify before you
        forward it.
      </Note>
    </>
  ),

  seo: () => (
    <>
      <P>Seven modes covering the full loop: research → brief → audit → schema → report.</P>
      <H2>Modes</H2>
      <Table
        head={["Mode", "Input", "Output"]}
        rows={[
          ["Keyword clusters", "Topic or site description", "Cluster table, intent, page types, quick wins"],
          ["Content brief", "Target keyword", "Outline, entities, metas, FAQ block"],
          ["On-page audit", "Page copy or HTML", "Fix table by impact and effort"],
          ["Technical checklist", "Stack description", "Critical / recommended / nice-to-have items"],
          ["Competitor gap", "Your site + competitors", "Gaps and a 30-day plan"],
          ["Schema / JSON-LD", "Page type", "Valid JSON-LD blocks"],
          ["Analytics report", "Metrics table", "What moved, why, what to test"],
        ]}
      />
      <H2>House rules the model follows</H2>
      <UL>
        <li>Meta titles under 60 characters, descriptions under 160.</li>
        <li>One H1 per page, ordered heading hierarchy.</li>
        <li>Intent stated before format — informational pages don't get pricing CTAs.</li>
        <li>It flags what the data cannot prove instead of inventing causation.</li>
      </UL>
    </>
  ),

  analyst: () => (
    <>
      <P>
        Paste rows from a spreadsheet or export. Nive infers the schema, flags quality issues and
        never invents values that aren't in the data.
      </P>
      <H2>Modes</H2>
      <Table
        head={["Mode", "Returns"]}
        rows={[
          ["Insights", "Overview, quality issues, 5 findings with supporting numbers"],
          ["SQL queries", "PostgreSQL DDL plus 6 analytical queries"],
          ["Cleaning plan", "Per-column fixes and a runnable pandas snippet"],
          ["Chart recipes", "4 charts with Vega-Lite specs"],
          ["Statistical review", "Test choice, assumptions, scipy/statsmodels code"],
          ["Forecast plan", "Baseline, seasonality read, metric, uncertainty"],
        ]}
      />
      <H2>Input format</H2>
      <Pre>{`order_id,created_at,country,plan,mrr,churned
1001,2026-01-04,IN,growth,2400,false
1002,2026-01-05,US,free,0,false`}</Pre>
      <P>
        Include the header row. 200-500 representative rows is usually enough — more rows rarely
        change the analysis and burn context.
      </P>
      <Note tone="warn">
        Never paste production data containing personal information. Use{" "}
        <Link to="/business/synthetic-data" className="underline">Synthetic Data</Link> to build a
        safe sample with the same shape.
      </Note>
    </>
  ),

  support: () => (
    <>
      <P>Six modes for the whole support surface, from a single reply to a macro library.</P>
      <H2>Modes</H2>
      <Table
        head={["Mode", "Returns"]}
        rows={[
          ["Draft reply", "A short and a long version in the requested tone"],
          ["Macro library", "10 canned responses with {{placeholders}} and tags"],
          ["Escalation summary", "Impact, timeline, repro steps, suspected cause, severity"],
          ["Tone rewrite", "Friendly / formal / apologetic-but-firm variants"],
          ["Transactional email", "3 subject lines, preview text, body, CTA, plain-text fallback"],
          ["Help-centre article", "Symptom, numbered fix, screenshots list, escalation path"],
        ]}
      />
      <H2>Guardrails</H2>
      <UL>
        <li>Tone rewrites keep every fact intact and flag over-promises.</li>
        <li>Escalation summaries separate what was observed from what is suspected.</li>
        <li>Nothing is auto-sent — Nive drafts, you send.</li>
      </UL>
    </>
  ),

  billing: () => (
    <>
      <P>Simple one-time 30-day plans in INR, processed by Razorpay. No auto-renew, no card on file.</P>
      <H2>Checkout flow</H2>
      <OL>
        <li>Pick a plan on <Link to="/pricing" className="underline">/pricing</Link>.</li>
        <li>An order is created server-side and Razorpay opens in-page.</li>
        <li>On success the client verifies the signature server-side.</li>
        <li>A webhook independently activates the plan — belt and suspenders.</li>
        <li>The success page polls for up to 30 seconds so activation never looks stuck.</li>
      </OL>
      <H2>Why there are two activation paths</H2>
      <P>
        Redirects can be interrupted (closed tab, flaky network). The webhook is the source of
        truth; the redirect path just makes activation feel instant. Both paths are idempotent, so a
        double-fire cannot double-charge or double-extend.
      </P>
      <H2>Troubleshooting</H2>
      <Table
        head={["Symptom", "What it means", "Fix"]}
        rows={[
          ["Payment taken, plan inactive after 60s", "Webhook delayed or blocked", "Email support with the Razorpay payment ID — activation is idempotent"],
          ["\"Could not create order\"", "Gateway credentials rejected", "Transient config issue on our side; retry, then contact support"],
          ["Plan expired earlier than expected", "30 days run from purchase, not first use", "Check the date on /business/usage"],
        ]}
      />
      <Note tone="warn">
        Keep the Razorpay payment ID from your receipt email. It is the fastest way for support to
        resolve any activation issue.
      </Note>
    </>
  ),

  security: () => (
    <>
      <H2>Application layer</H2>
      <UL>
        <li>Strict Content-Security-Policy, HSTS and Referrer-Policy on every response.</li>
        <li>Per-IP rate limits on public endpoints, with an abuse log for repeat offenders.</li>
        <li>Webhook signature verification plus replay protection via a processed-events table.</li>
        <li>All secrets live server-side only and are never shipped to the browser.</li>
      </UL>
      <H2>Data layer</H2>
      <UL>
        <li><strong>Row-Level Security</strong> is enabled on every user table — no table is readable without a matching policy.</li>
        <li>Roles live in a dedicated <C>user_roles</C> table behind a <C>SECURITY DEFINER</C> <C>has_role()</C> function. Roles are never trusted from the client.</li>
        <li>Payment approval tokens are excluded from client-readable columns.</li>
        <li>Internal email-queue functions are restricted to the service role.</li>
      </UL>
      <H2>Auth</H2>
      <UL>
        <li>Email and Google OAuth. Anonymous sign-ups are disabled.</li>
        <li>OAuth <C>redirect_uri</C> is pinned to the same origin.</li>
        <li>Sessions refresh automatically and degrade safely when storage is blocked.</li>
      </UL>
      <H2>Model data handling</H2>
      <P>
        Prompts and generations are not used to train models. Outputs are generated per request and
        stored only where you explicitly save them (conversations, saved schemas, agents).
      </P>
      <Note tone="ok">
        Responsible disclosure:{" "}
        <a href="mailto:security@nive-ai.co.in" className="underline">security@nive-ai.co.in</a>. We
        acknowledge within 48 hours.
      </Note>
    </>
  ),

  embedding: () => (
    <>
      <P>Nive is embeddable. Every route renders inside a cross-origin iframe without console errors.</P>
      <H2>Minimal embed</H2>
      <Pre>{`<iframe
  src="https://nive-ai.co.in/code"
  width="100%"
  height="720"
  style="border:0;border-radius:12px"
  allow="clipboard-write; microphone"
  title="Nive AI"
></iframe>`}</Pre>
      <H2>What we do to make it work</H2>
      <UL>
        <li><C>frame-ancestors</C> permits network and non-network schemes, so sandboxed and <C>blob:</C> parents work too.</li>
        <li><C>X-Frame-Options</C> is not sent — it cannot express the same policy.</li>
        <li>Storage access is wrapped: when a browser partitions or blocks third-party storage, Nive falls back to in-memory state instead of throwing.</li>
        <li>Theme and preset state are read after mount, so embedded copies never hydrate-mismatch.</li>
      </UL>
      <H2>Permissions to grant</H2>
      <Table
        head={["Feature", "Required allow attribute"]}
        rows={[
          ["Voice Agents", <C key="m">microphone</C>],
          ["Copy buttons", <C key="c">clipboard-write</C>],
          ["Live preview", "Nested sandboxed iframe — no extra permission needed"],
        ]}
      />
      <Note tone="warn">
        Sign-in inside an iframe depends on the parent browser's third-party storage rules. If users
        report being signed out on reload, open Nive in a new tab for the auth step.
      </Note>
    </>
  ),

  api: () => (
    <>
      <P>Two public endpoints exist today. Everything else is internal to signed-in sessions.</P>
      <H2>POST /api/public/try-ai</H2>
      <P>Free demo endpoint. Rate limited to 10 requests per hour per IP.</P>
      <Pre>{`curl -X POST https://nive-ai.co.in/api/public/try-ai \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"Explain OAuth in 3 bullets."}'`}</Pre>
      <Pre>{`// 200 OK
{ "text": "..." }

// 429 Too Many Requests
{ "error": "You've hit the free demo limit..." }`}</Pre>
      <H2>POST /api/public/razorpay/webhook</H2>
      <P>
        Razorpay only. Verifies the <C>X-Razorpay-Signature</C> HMAC-SHA256 header against the
        configured webhook secret and activates plans on <C>payment.captured</C>. Replayed event IDs
        are rejected. Not intended for public calls.
      </P>
      <H2>Errors</H2>
      <Table
        head={["Status", "Meaning", "Action"]}
        rows={[
          ["400", "Malformed body or failed validation", "Fix the request"],
          ["401", "Signature verification failed", "Check the shared secret"],
          ["429", "Rate limited", "Back off and retry later"],
          ["500", "Upstream model or gateway failure", "Retry with backoff"],
        ]}
      />
      <Note>
        A full authenticated API is on the roadmap. If you need programmatic access today, tell us
        the use case at <a href="mailto:support@nive-ai.co.in" className="underline">support@nive-ai.co.in</a>.
      </Note>
    </>
  ),

  architecture: () => (
    <>
      <H2>Stack</H2>
      <UL>
        <li><strong>Frontend</strong> — React 19, TanStack Router/Start v1, Vite 7, Tailwind v4.</li>
        <li><strong>Backend</strong> — TanStack server functions running on an edge runtime.</li>
        <li><strong>Database + auth</strong> — managed Postgres with Row-Level Security.</li>
        <li><strong>AI</strong> — server-side model routing; keys never reach the browser.</li>
        <li><strong>Payments</strong> — Razorpay, INR, one-time orders.</li>
        <li><strong>Email</strong> — transactional templates through managed email infrastructure.</li>
      </UL>
      <H2>Request path</H2>
      <OL>
        <li>The browser calls a typed server function with the session bearer token attached.</li>
        <li>Auth middleware verifies the token and resolves the user before the handler runs.</li>
        <li>The handler reads limits, calls the model server-side and records usage.</li>
        <li>The response streams or returns; nothing sensitive crosses the boundary.</li>
      </OL>
      <H2>Data model highlights</H2>
      <Table
        head={["Table", "Holds", "Access"]}
        rows={[
          ["conversations / messages", "Code Studio history", "Owner only via RLS"],
          ["brand_profiles", "Tone and audience memory", "Owner only"],
          ["saved schemas", "Synthetic data definitions", "Owner only"],
          ["user_plans", "Active plan and expiry", "Owner read, service write"],
          ["user_roles", "Role assignments", "Read via has_role() only"],
          ["processed_webhook_events", "Replay protection", "Service role only"],
          ["abuse_log", "Rate-limit offenders", "Service role only"],
        ]}
      />
    </>
  ),

  troubleshooting: () => (
    <>
      <H2>Common issues</H2>
      <Table
        head={["Symptom", "Likely cause", "Fix"]}
        rows={[
          ["\"AI is not configured on this deployment\"", "Model credentials missing on the server", "Contact support — nothing to do client-side"],
          ["Blank output / empty response", "Model returned nothing for an ambiguous prompt", "Add one concrete constraint and re-run"],
          ["\"Model returned invalid JSON\"", "Structured mode hit a malformed generation", "Re-run; if repeated, shorten the input"],
          ["Signed out on every reload inside an iframe", "Third-party storage partitioning", "Open Nive in a new tab to sign in"],
          ["Credits exhausted before you finished", "Daily pool reset is at 00:00 UTC", "Wait for reset or upgrade the plan"],
          ["Voice button does nothing", "Browser lacks SpeechRecognition", "Use Chrome or Edge, or type the brief"],
          ["Payment captured, plan inactive", "Webhook delayed", "Wait 60s, then email support with the payment ID"],
        ]}
      />
      <H2>Getting help fast</H2>
      <P>
        Include: the tool and mode, the exact error text, roughly when it happened, and the payment
        ID if it's billing related. Mail{" "}
        <a href="mailto:support@nive-ai.co.in" className="underline">support@nive-ai.co.in</a>.
      </P>
    </>
  ),

  faq: () => (
    <>
      <H3>Do you train on my data?</H3>
      <P>
        No. Prompts and generations are never used for training. See{" "}
        <Link to="/privacy" className="underline">Privacy</Link>.
      </P>
      <H3>Can I get a refund?</H3>
      <P>
        See the <Link to="/refund" className="underline">Refund Policy</Link>. If a payment
        succeeded but the plan never activated, we always either activate or refund.
      </P>
      <H3>What happens after 30 days?</H3>
      <P>You drop back to the free tier automatically. No auto-renew, no surprise charges.</P>
      <H3>Do credits roll over?</H3>
      <P>No. They reset daily at 00:00 UTC so heavy days never starve the next one.</P>
      <H3>Can my team share one account?</H3>
      <P>
        Technically yes, but limits are per account and history mixes. Proper team workspaces are on
        the roadmap — tell us if you need them now.
      </P>
      <H3>Can I self-host?</H3>
      <P>Not today. Reach out if you need an enterprise deployment.</P>
      <H3>Is Nive in beta?</H3>
      <P>
        Yes. Tools are live and usable, but interfaces can change between releases. Anything that
        would break saved work gets a notice first.
      </P>
    </>
  ),

  marketplace: () => (
    <>
      <P>
        The <Link to="/marketplace" className="underline">Marketplace</Link> is the front door to the
        whole ecosystem. It lists every first-party Nive studio, every integration, and every recipe
        the community has published — all searchable in one grid.
      </P>
      <H2>Three kinds of listing</H2>
      <Table
        head={["Kind", "What it is", "What Install does"]}
        rows={[
          ["Tool", "A full Nive studio such as Code Studio or SEO & Analytics", "Pins it to your Installed tab for one-click opening"],
          ["Agent", "A prompt recipe with instructions and brand context", "Saves it to your workspace; copy the prompt into Custom Agents"],
          ["Integration", "A platform capability: payments, embedding, API, sign-in", "Marks it as in use and links to its setup docs"],
        ]}
      />
      <H2>Installing</H2>
      <OL>
        <li>Search or filter by kind.</li>
        <li>Press <strong>Install</strong>. You must be signed in — installs are stored against your account.</li>
        <li>Open the <strong>Installed</strong> tab to see everything you use, then hit <C>Open</C>.</li>
        <li><strong>Remove</strong> un-pins it. Nothing is deleted and no credits are spent.</li>
      </OL>
      <Note>
        Installing is free on every plan. It changes what you see, not what you are billed for.
      </Note>
      <H2>Sharing your own</H2>
      <P>
        Press <strong>Share your agent</strong> and fill in a name, a one-line tagline, an optional
        long description and — for agents — the prompt itself. Listings publish immediately and are
        readable by anyone, so never paste API keys, customer data or private prompts you rely on
        commercially.
      </P>
      <UL>
        <li>You can edit or unpublish your own listings at any time from the card's bin icon.</li>
        <li>Install counts are incremented server-side, so nobody can inflate their own numbers.</li>
        <li>Listings that break the acceptable-use rules are removed without notice.</li>
      </UL>
      <H2>Data model</H2>
      <Table
        head={["Table", "Holds", "Who can read it"]}
        rows={[
          ["marketplace_listings", "Community listings and install counts", "Anyone, when published; authors always see their own"],
          ["marketplace_installs", "Which items you installed", "Only you"],
        ]}
      />
    </>
  ),

  legal: () => (
    <>
      <P>
        The <Link to="/legal" className="underline">Legal &amp; Policy Agent</Link> is drafting
        support for the paperwork around a product. It is <strong>not legal advice</strong> — every
        output is written to be reviewed by a qualified lawyer in your jurisdiction.
      </P>
      <H2>Modes</H2>
      <Table
        head={["Mode", "Use it when", "You get"]}
        rows={[
          ["Draft policy", "You need terms, privacy or refund copy", "Numbered clauses with [BRACKET] placeholders"],
          ["Clause review", "Someone sent you a contract", "Clause | meaning | risk | suggested redline"],
          ["Plain English", "Nobody understands the current text", "A readable rewrite that keeps every obligation"],
          ["Compliance checklist", "You are about to launch", "Must / should / consider items per area"],
          ["Data mapping / DPA", "A customer asks how you process data", "Data categories, retention, sub-processors, DPA skeleton"],
          ["Notice / letter", "You need to escalate formally", "A firm, factual notice with a deadline"],
        ]}
      />
      <Note tone="warn">
        Never paste signed contracts containing third-party personal data you are not allowed to
        share with a processor. Redact names first.
      </Note>
    </>
  ),

  product: () => (
    <>
      <P>
        <Link to="/product" className="underline">Product &amp; PRD Studio</Link> turns a rough idea
        into artefacts a team can act on: a spec, a backlog, a roadmap and the notes that announce it.
      </P>
      <H2>Modes</H2>
      <UL>
        <li><strong>PRD</strong> — problem, user, metrics, in/out scope, stories, risks, phased rollout.</li>
        <li><strong>User stories</strong> — as a / I want / so that, with Given-When-Then criteria and S/M/L sizing.</li>
        <li><strong>Roadmap</strong> — now / next / later, each bet paired with the outcome it chases.</li>
        <li><strong>Prioritisation</strong> — a RICE table with the arithmetic shown and assumptions declared.</li>
        <li><strong>Research plan</strong> — hypotheses, method, recruiting criteria, non-leading questions.</li>
        <li><strong>Release notes</strong> — highlights, fixes, breaking changes plus a short announcement.</li>
      </UL>
      <H2>Good chaining</H2>
      <OL>
        <li>Run <strong>PRD</strong> on the idea.</li>
        <li>Paste the PRD into <strong>User stories</strong> to get the backlog.</li>
        <li>Feed the shipped items into <strong>Release notes</strong>.</li>
        <li>Freeze the whole sequence as a workflow in <Link to="/automations" className="underline">Automations</Link>.</li>
      </OL>
    </>
  ),

  translate: () => (
    <>
      <P>
        <Link to="/translate" className="underline">Translation &amp; Localization</Link> covers the
        whole path from raw string to shipped locale: translate, adapt to the market, transcreate the
        marketing lines, lock terminology, QA the result and export keys.
      </P>
      <H2>Modes</H2>
      <Table
        head={["Mode", "Best for", "Notes"]}
        rows={[
          ["Translate", "Docs, emails, UI strings", "Preserves markdown and {{placeholders}}"],
          ["Localise", "Anything with money, dates or units", "Returns a Before | After change table"],
          ["Transcreate", "Headlines and ads", "3 options plus back-translations"],
          ["Glossary & style", "Before a big localisation push", "Term table, formality, do-not-translate list"],
          ["Translation QA", "Reviewing an agency delivery", "Findings table with severity plus a corrected version"],
          ["i18n keys", "Handing copy to engineering", "Flat JSON per locale with dot-notation keys"],
        ]}
      />
      <H2>Placeholder safety</H2>
      <P>
        Interpolation tokens are treated as opaque. If a target language needs a different word
        order, the token moves with the phrase rather than being translated. Always run
        <strong> Translation QA</strong> before shipping a locale file you generated in bulk.
      </P>
    </>
  ),

  hr: () => (
    <>
      <P>
        <Link to="/hr" className="underline">People &amp; Hiring Agent</Link> brings structure to
        hiring: the same scorecard for every candidate, questions mapped to competencies, and an
        onboarding plan that ends in a shipped win rather than a reading list.
      </P>
      <H2>Modes</H2>
      <UL>
        <li><strong>Job post</strong> — bias-checked, specific, with must-have versus nice-to-have split out.</li>
        <li><strong>Scorecard</strong> — outcomes, competencies, red flags and a 1-4 rubric.</li>
        <li><strong>Interview kit</strong> — stage plan, 12 mapped questions, practical exercise with grading.</li>
        <li><strong>Résumé screen</strong> — evidence per requirement, gaps, probes, advance/hold/decline.</li>
        <li><strong>Offer &amp; comms</strong> — offers, rejections, keep-warms and reference requests.</li>
        <li><strong>Onboarding plan</strong> — 30-60-90 goals, access list, first win, check-in questions.</li>
      </UL>
      <Note tone="warn">
        Screens are decision <em>support</em>. A human makes every hiring decision, and only
        job-relevant evidence is considered. Remove personal details you do not need before pasting a
        résumé.
      </Note>
    </>
  ),
};
