import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CreditWalletView = {
  balance: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
};

export type CreditLedgerEntry = {
  id: string;
  delta: number;
  reason: string;
  tool: string | null;
  balanceAfter: number;
  at: string;
};

export const getCreditWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CreditWalletView> => {
    const { supabase, userId } = context as {
      supabase: { from: (t: string) => any };
      userId: string;
    };
    const { data, error } = await supabase
      .from("credit_wallets")
      .select("balance, lifetime_granted, lifetime_spent")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      balance: data?.balance ?? 0,
      lifetimeGranted: data?.lifetime_granted ?? 0,
      lifetimeSpent: data?.lifetime_spent ?? 0,
    };
  });

export const getCreditHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ limit: z.number().int().min(1).max(200).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<CreditLedgerEntry[]> => {
    const { supabase, userId } = context as {
      supabase: { from: (t: string) => any };
      userId: string;
    };
    const { data: rows, error } = await supabase
      .from("credit_ledger")
      .select("id, delta, reason, tool, balance_after, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 60);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({
      id: r.id as string,
      delta: r.delta as number,
      reason: r.reason as string,
      tool: (r.tool as string | null) ?? null,
      balanceAfter: r.balance_after as number,
      at: r.created_at as string,
    }));
  });
