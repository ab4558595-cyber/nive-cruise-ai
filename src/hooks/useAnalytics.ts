import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, string | number | boolean | undefined>
    ) => void;
    dataLayer: unknown[];
  }
}

const GA_ID = "G-3PCB797DC4";

export function useAnalytics() {
  const router = useRouter();

  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => {
      if (typeof window === "undefined" || !window.gtag) return;
      const loc = window.location;
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: loc.href,
        page_path: loc.pathname + loc.search,
        send_to: GA_ID,
      });
    });
    return unsub;
  }, [router]);
}
