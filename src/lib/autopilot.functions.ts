import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CREDIT_COSTS } from "./credit-costs";
import type { AutopilotRun, AutopilotStep } from "./autopilot.server";

export type { AutopilotRun, AutopilotStep };

export const AUTOPILOT_COST = CREDIT_COSTS.autopilot;

export const runAutopilot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        goal: z.string().min(10).max(3000),
        context: z.string().max(4000).optional(),
        depth: z.union([z.literal(3), z.literal(4), z.literal(5)]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<AutopilotRun & { creditsLeft: number }> => {
    const { userId } = context as { userId: string };
    const { chargeCredits } = await import("./credits.server");
    const { runAutopilotPipeline } = await import("./autopilot.server");

    const creditsLeft = await chargeCredits(
      userId,
      CREDIT_COSTS.autopilot,
      "autopilot_run",
      "autopilot",
      { depth: data.depth ?? 4 },
    );

    try {
      const run = await runAutopilotPipeline(data.goal, data.context, data.depth ?? 4);
      return { ...run, creditsLeft };
    } catch (e) {
      // Refund failed runs — users are never charged for work they didn't get.
      const { giveCredits } = await import("./credits.server");
      await giveCredits(userId, CREDIT_COSTS.autopilot, "autopilot_refund", {
        error: e instanceof Error ? e.message.slice(0, 200) : "unknown",
      });
      throw e;
    }
  });
