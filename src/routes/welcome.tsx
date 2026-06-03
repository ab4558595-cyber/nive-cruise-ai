import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Nive AI — Code infrastructure for the next billion builds" },
      { name: "description", content: "Nive AI writes production-quality code for web, mobile, embedded, and ML — from your first prototype to your billionth deployment." },
      { property: "og:title", content: "Nive AI — Code infrastructure for builders" },
      { property: "og:description", content: "From your first prototype to your billionth deployment. Nive AI writes production code for any platform." },
      { property: "og:url", content: "/welcome" },
    ],
    links: [{ rel: "canonical", href: "/welcome" }],
  }),
  component: Welcome,
});

const LOGOS = [
  { name: "amazon", text: "amazon" },
  { name: "nvidia", text: "NVIDIA" },
  { name: "ford", text: "Ford" },
  { name: "coinbase", text: "coinbase" },
  { name: "google", text: "Google" },
  { name: "shopify", text: "shopify" },
  { name: "mindbody", text: "mindbody" },
];

function Welcome() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]" style={{ fontFamily: "'Inter', 'Sohne', system-ui, -apple-system, sans-serif" }}>
      <div className="relative overflow-hidden bg-white">
        <Ribbon />

        {/* Nav */}
        <header className="relative z-20 mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-5 sm:px-10">
          <div className="flex items-center gap-10">
            <Link to="/welcome" className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[22px] font-bold tracking-tight text-[#0a2540]">nive</span>
            </Link>

            <nav className="hidden items-center gap-6 text-[15px] font-medium text-[#0a2540] md:flex">
              <NavItem label="Products" />
              <NavItem label="Solutions" />
              <NavItem label="Developers" />
              <NavItem label="Resources" />
              <Link to="/pricing" className="whitespace-nowrap transition-colors hover:text-[#635bff]">Pricing</Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/auth"
              className="hidden whitespace-nowrap rounded-full bg-white px-4 py-2 text-[14px] font-medium text-[#ff5a36] shadow-sm transition-shadow hover:shadow-md sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#635bff] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#0a2540]"
            >
              Get started <span aria-hidden>›</span>
            </Link>
          </div>
        </header>


        {/* Hero content */}
        <section className="relative z-10 mx-auto max-w-[1280px] px-6 pb-28 pt-16 sm:px-10 sm:pt-24 lg:pb-40 lg:pt-32">
          <div className="max-w-[760px]">
            <p className="mb-6 text-[14px] font-medium text-[#0a2540]/70">
              Lines of code shipped with Nive AI:{" "}
              <span className="text-[#635bff]">1,657,113</span>
            </p>

            <h1
              className="text-[44px] font-bold leading-[1.05] tracking-[-0.02em] text-[#0a2540] sm:text-[64px] lg:text-[76px]"
              style={{ fontFamily: "'Inter', 'Sohne', system-ui, sans-serif" }}
            >
              Code infrastructure to{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(95deg, #635bff 0%, #00d4ff 40%, #ff4d8d 100%)" }}
              >
                grow your product.
              </span>{" "}
              Ship apps, firmware, and AI systems — from your first prototype to your billionth deployment.
            </h1>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#635bff] px-5 py-3 text-[15px] font-medium text-white shadow-[0_4px_14px_rgba(99,91,255,0.35)] transition-all hover:translate-y-[-1px] hover:bg-[#5048d6] hover:shadow-[0_8px_24px_rgba(99,91,255,0.45)]"
              >
                Start building <span aria-hidden>›</span>
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#635bff] transition-colors hover:text-[#0a2540]"
              >
                Contact sales <span aria-hidden>›</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Logo strip */}
        <div className="relative z-10 border-t border-[#0a2540]/8 bg-white/60 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-10 gap-y-6 px-6 py-8 sm:px-10">
            {LOGOS.map((logo) => (
              <span
                key={logo.name}
                className="text-[18px] font-semibold tracking-tight text-[#425466] opacity-80"
              >
                {logo.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 transition-colors hover:text-[#635bff]"
    >
      {label}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
        <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/**
 * Flowing ribbon hero artwork — hand-tuned SVG paths with multi-stop gradients.
 * Inspired by Stripe's iconic homepage flow, but original geometry.
 */
function Ribbon() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <svg
        className="absolute right-[-15%] top-[-20%] h-[160%] w-[110%] sm:right-[-5%] sm:w-[80%]"
        viewBox="0 0 800 900"
        preserveAspectRatio="xMaxYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ribbon-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a4c8ff" />
            <stop offset="40%" stopColor="#d4b3ff" />
            <stop offset="100%" stopColor="#ff7eb6" />
          </linearGradient>
          <linearGradient id="ribbon-b" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffb86b" />
            <stop offset="50%" stopColor="#ff6b6b" />
            <stop offset="100%" stopColor="#ff3d8a" />
          </linearGradient>
          <linearGradient id="ribbon-c" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffd28d" />
            <stop offset="60%" stopColor="#ff8a5c" />
            <stop offset="100%" stopColor="#c4458f" />
          </linearGradient>
          <linearGradient id="ribbon-d" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe5b4" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ff9aa2" stopOpacity="0.9" />
          </linearGradient>
          <filter id="ribbon-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Soft outer wash */}
        <path
          d="M 800 -50 C 600 60, 460 200, 520 380 C 580 560, 760 640, 820 820"
          stroke="url(#ribbon-d)"
          strokeWidth="220"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
          filter="url(#ribbon-blur)"
        />

        {/* Cool blue→purple→pink ribbon */}
        <path
          d="M 780 -40 C 540 80, 360 240, 480 460 C 600 680, 780 720, 880 900"
          stroke="url(#ribbon-a)"
          strokeWidth="130"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />

        {/* Warm orange→pink ribbon (the bright signature stroke) */}
        <path
          d="M 760 -20 C 500 100, 380 280, 520 480 C 640 660, 820 700, 900 880"
          stroke="url(#ribbon-b)"
          strokeWidth="80"
          strokeLinecap="round"
          fill="none"
        />

        {/* Inner highlight */}
        <path
          d="M 740 0 C 500 120, 420 280, 540 470 C 650 640, 820 680, 880 860"
          stroke="url(#ribbon-c)"
          strokeWidth="32"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />

        {/* Thin white core for sheen */}
        <path
          d="M 730 20 C 510 130, 430 290, 550 460 C 650 620, 810 660, 870 840"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.45"
        />
      </svg>

      {/* Soft fade on left so text stays readable */}
      <div
        className="absolute inset-y-0 left-0 w-2/3"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.92) 45%, rgba(255,255,255,0) 100%)",
        }}
      />
    </div>
  );
}
