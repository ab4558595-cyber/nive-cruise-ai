import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2, Zap, Monitor, Cpu, Wifi, ShieldCheck, Clock, IndianRupee } from "lucide-react";
import bgmiImg from "@/assets/games/bgmi.jpg";
import freeFireImg from "@/assets/games/free-fire.jpg";
import gtaVImg from "@/assets/games/gta-v.jpg";
import valorantImg from "@/assets/games/valorant.jpg";
import fortniteImg from "@/assets/games/fortnite.jpg";
import codImg from "@/assets/games/cod-warzone.jpg";
import minecraftImg from "@/assets/games/minecraft.jpg";
import fifaImg from "@/assets/games/fifa-24.jpg";
import rdr2Img from "@/assets/games/rdr2.jpg";

export const Route = createFileRoute("/cloud/")({
  head: () => ({
    meta: [
      { title: "Nive Cloud Gaming — Rent cloud games by the hour" },
      { name: "description", content: "Play BGMI, Free Fire, GTA V and more on high-end cloud rigs. Pay only for the hours you play." },
      { property: "og:title", content: "Nive Cloud Gaming" },
      { property: "og:description", content: "High-end cloud gaming rigs — rent by the hour, play instantly." },
    ],
    links: [{ rel: "canonical", href: "/cloud" }],
  }),
  component: CloudIndex,
});

export type CloudGame = {
  id: string;
  title: string;
  genre: string;
  rigTier: "Standard" | "Performance" | "Ultra";
  pricePerHour: number; // INR
  image: string;
  accent: string;
  blurb: string;
};

export const GAMES: CloudGame[] = [
  { id: "bgmi", title: "BGMI", genre: "Battle Royale", rigTier: "Performance", pricePerHour: 35, image: bgmiImg, accent: "#f59e0b", blurb: "Battlegrounds Mobile India on a 144Hz cloud rig — zero lag squads." },
  { id: "free-fire", title: "Free Fire MAX", genre: "Battle Royale", rigTier: "Standard", pricePerHour: 20, image: freeFireImg, accent: "#ef4444", blurb: "Booyah-ready cloud instance with 60fps streaming." },
  { id: "gta-v", title: "GTA V Online", genre: "Open World", rigTier: "Ultra", pricePerHour: 60, image: gtaVImg, accent: "#10b981", blurb: "Los Santos at Ultra settings on an RTX-class rig." },
  { id: "valorant", title: "Valorant", genre: "Tactical Shooter", rigTier: "Performance", pricePerHour: 40, image: valorantImg, accent: "#635bff", blurb: "Low-latency competitive ranked sessions." },
  { id: "fortnite", title: "Fortnite", genre: "Battle Royale", rigTier: "Performance", pricePerHour: 35, image: fortniteImg, accent: "#06b6d4", blurb: "Build, battle, dance — full graphics on a cloud rig." },
  { id: "cod-warzone", title: "Call of Duty: Warzone", genre: "Shooter", rigTier: "Ultra", pricePerHour: 55, image: codImg, accent: "#0a2540", blurb: "Verdansk drops with no install, no patches." },
  { id: "minecraft", title: "Minecraft", genre: "Sandbox", rigTier: "Standard", pricePerHour: 18, image: minecraftImg, accent: "#22c55e", blurb: "Shaders + mods preloaded — just play." },
  { id: "fifa-24", title: "EA FC 24", genre: "Sports", rigTier: "Performance", pricePerHour: 30, image: fifaImg, accent: "#3b82f6", blurb: "Couch co-op + Ultimate Team from any device." },
  { id: "rdr2", title: "Red Dead Redemption 2", genre: "Open World", rigTier: "Ultra", pricePerHour: 65, image: rdr2Img, accent: "#b45309", blurb: "Cinematic Wild West at Ultra, instant boot." },
];


function CloudIndex() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Nav */}
      <header className="border-b border-white/10 bg-[#0a0a14]/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 sm:px-10">
          <Link to="/welcome" className="flex items-center gap-2 text-[20px] font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[#635bff] to-[#00d4ff] bg-clip-text text-transparent">nive</span>
            <span className="text-white/60 text-[13px] font-medium">/ cloud gaming</span>
          </Link>
          <nav className="flex items-center gap-3 text-[14px]">
            <Link to="/welcome" className="hidden sm:inline text-white/70 hover:text-white">Home</Link>
            <Link to="/business" className="hidden sm:inline text-white/70 hover:text-white">Business</Link>
            <Link to="/auth" className="rounded-full bg-white px-4 py-1.5 font-medium text-[#0a0a14] hover:bg-white/90">Sign in</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#635bff]/20 via-transparent to-[#ff4d8d]/15" />
        <div className="relative mx-auto max-w-[1280px] px-6 py-20 sm:px-10 sm:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" /> 12 cloud rigs online · ~3s queue
          </div>
          <h1 className="mt-5 max-w-[820px] text-[44px] font-bold leading-[1.05] tracking-[-0.025em] sm:text-[68px]">
            Play{" "}
            <span className="bg-gradient-to-r from-[#635bff] via-[#00d4ff] to-[#ff4d8d] bg-clip-text text-transparent">AAA games</span>{" "}
            on any device. Rent by the hour.
          </h1>
          <p className="mt-5 max-w-[640px] text-[17px] leading-relaxed text-white/70">
            BGMI, Free Fire, GTA V, Valorant and more — streamed at 60–144 FPS from a high-end cloud rig.
            No downloads, no installs. Pay only for the hours you play.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Feature icon={<Zap className="h-4 w-4" />} label="Instant boot" />
            <Feature icon={<Monitor className="h-4 w-4" />} label="Up to 144 FPS" />
            <Feature icon={<Wifi className="h-4 w-4" />} label="Low-latency" />
            <Feature icon={<ShieldCheck className="h-4 w-4" />} label="Encrypted sessions" />
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#00d4ff]">Game catalog</p>
            <h2 className="mt-2 text-[30px] font-bold tracking-[-0.02em] sm:text-[40px]">Pick a game. Pick your hours.</h2>
          </div>
          <div className="hidden text-right text-[13px] text-white/60 sm:block">
            Pricing in ₹ per hour · billed only for time used
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/10 bg-[#11111c]">
        <div className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10">
          <h2 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[36px]">How it works</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Step n={1} icon={<Gamepad2 className="h-5 w-5" />} title="Pick a game" body="Choose from BGMI, Free Fire, GTA V and more." />
            <Step n={2} icon={<Clock className="h-5 w-5" />} title="Enter hours" body="Tell us how long you want to play. We estimate the price instantly." />
            <Step n={3} icon={<Cpu className="h-5 w-5" />} title="Boot the rig" body="A dedicated cloud rig spins up in seconds. Play from any device." />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 text-center text-[13px] text-white/50">
        © Nive Cloud Gaming · Cancel anytime · Refund unused hours
      </footer>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white/80">
      <span className="text-[#00d4ff]">{icon}</span>
      {label}
    </div>
  );
}

function Step({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#635bff]/20 text-[#a5b4fc]">{icon}</div>
      <div className="text-[12px] font-semibold uppercase tracking-wider text-white/50">Step {n}</div>
      <h3 className="mt-1 text-[18px] font-semibold">{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-white/70">{body}</p>
    </div>
  );
}

function GameCard({ game }: { game: CloudGame }) {
  return (
    <Link
      to="/cloud/rent/$gameId"
      params={{ gameId: game.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 transition-all hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_20px_50px_rgba(99,91,255,0.25)]"
    >
      <div
        className="mb-4 flex h-32 items-center justify-center rounded-xl text-[64px]"
        style={{ background: `linear-gradient(135deg, ${game.accent}33, ${game.accent}11)` }}
      >
        {game.emoji}
      </div>
      <div className="flex items-center justify-between text-[12px] text-white/60">
        <span>{game.genre}</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">{game.rigTier}</span>
      </div>
      <h3 className="mt-2 text-[20px] font-bold">{game.title}</h3>
      <p className="mt-1 text-[13.5px] leading-relaxed text-white/65">{game.blurb}</p>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <div className="flex items-baseline gap-1 text-white">
          <IndianRupee className="h-4 w-4" />
          <span className="text-[22px] font-bold">{game.pricePerHour}</span>
          <span className="text-[12px] text-white/60">/ hour</span>
        </div>
        <span className="rounded-full bg-[#635bff] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors group-hover:bg-[#5048d6]">
          Rent now →
        </span>
      </div>
    </Link>
  );
}
