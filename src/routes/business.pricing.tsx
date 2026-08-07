import { createFileRoute, redirect } from "@tanstack/react-router";

// Pricing is unified at /pricing — one credit wallet powers every Nive tool.
export const Route = createFileRoute("/business/pricing")({
  beforeLoad: () => {
    throw redirect({ to: "/pricing" });
  },
});
