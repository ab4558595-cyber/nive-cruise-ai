// Server-only credit helpers. Uses the service-role client so the atomic
// spend_credits / grant_credits SQL functions stay unreachable from the browser.

export type CreditWallet = {
  balance: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
};

export async function readWallet(userId: string): Promise<CreditWallet> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
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
}

/** Atomically deduct credits. Throws a friendly error when the balance is short. */
export async function chargeCredits(
  userId: string,
  amount: number,
  reason: string,
  tool?: string,
  metadata: Record<string, unknown> = {},
): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("spend_credits", {
    _user_id: userId,
    _amount: amount,
    _reason: reason,
    _tool: tool,
    _metadata: metadata as never,
  });
  if (error) {
    if (error.message.includes("INSUFFICIENT_CREDITS")) {
      const wallet = await readWallet(userId);
      throw new Error(
        `Not enough credits — this run costs ${amount} and you have ${wallet.balance}. Buy more credits from the pricing page.`,
      );
    }
    throw new Error(error.message);
  }
  return (data as number) ?? 0;
}

export async function giveCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata: Record<string, unknown> = {},
): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("grant_credits", {
    _user_id: userId,
    _amount: amount,
    _reason: reason,
    _tool: undefined,
    _metadata: metadata as never,
  });
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}
