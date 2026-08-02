import { useEffect, useState } from "react";
import { Sparkles, MessageSquare, PlayCircle, Rocket, X } from "lucide-react";
import { safeStorage } from "@/lib/safeStorage";

const STORAGE_KEY = "nive_tour_pending";

export function markTourPending() {
  try {
    safeStorage.setItem(STORAGE_KEY, "1");
  } catch {}
}

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to Nive AI 🎉",
    body: "Glad you're here. Let's take a 30-second tour so you can start building right away.",
  },
  {
    icon: MessageSquare,
    title: "Describe what you want to build",
    body: "Type a prompt like 'Build a React todo app' or pick a suggestion. Nive AI generates production-quality code instantly.",
  },
  {
    icon: PlayCircle,
    title: "See it live",
    body: "Web projects render in the Live Preview panel on the right. Toggle between Code and Preview anytime.",
  },
  {
    icon: Rocket,
    title: "You're all set",
    body: "Pick a plan from the Pricing page whenever you're ready — pay securely via UPI and keep building.",
  },
];

export function GuidedTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (safeStorage.getItem(STORAGE_KEY) === "1") {
        setOpen(true);
        safeStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, []);

  if (!open) return null;
  const s = STEPS[step];
  const Icon = s.icon;
  const isLast = step === STEPS.length - 1;

  const close = () => setOpen(false);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <button
          onClick={close}
          aria-label="Close tour"
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#635bff] to-[#a5a3ff] text-white">
          <Icon size={28} />
        </div>

        <h2 className="mb-2 text-xl font-semibold text-[#0a2540]">{s.title}</h2>
        <p className="mb-6 text-[15px] leading-relaxed text-[#3c4257]">{s.body}</p>

        <div className="mb-6 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-[#635bff]" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={close}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Skip tour
          </button>
          <button
            onClick={() => (isLast ? close() : setStep(step + 1))}
            className="rounded-md bg-[#635bff] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#5048e5]"
          >
            {isLast ? "Start building" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
