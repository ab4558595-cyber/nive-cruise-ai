// Client-safe credit price list. One place, so UI and server agree.

export const CREDIT_COSTS = {
  marketing: 1,
  synthetic: 2,
  studio_mode: 2,
  voice_brief: 2,
  design_concept: 3,
  automation_step: 2,
  custom_agent: 2,
  /** Autonomous multi-step agent run (plan → research → draft → critique → finalise). */
  autopilot: 10,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export function costOf(action: CreditAction): number {
  return CREDIT_COSTS[action];
}
