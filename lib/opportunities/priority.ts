/**
 * First-version priority scoring: deterministic rules, not a trigger.
 * Recomputed by Server Action whenever an opportunity is created or its
 * inputs change (stage, value). Structured as a pure function so a future
 * smarter model can replace the body without touching callers or schema —
 * see cerebro/oferta.md and the product brief's "not a fake AI" principle.
 */

export type OpportunityPriority = "critical" | "high" | "medium" | "low";

export function calculateOpportunityPriority({
  daysUntilDue,
  estimatedValueCents,
}: {
  /** Negative when overdue. */
  daysUntilDue: number;
  estimatedValueCents: number | null;
}): OpportunityPriority {
  const value = estimatedValueCents ?? 0;

  if (daysUntilDue < 0) return "critical";
  if (daysUntilDue <= 7 && value >= 100000) return "critical"; // due this week + R$1000+
  if (daysUntilDue <= 15) return "high";
  if (value >= 200000) return "high"; // R$2000+ regardless of timing
  if (daysUntilDue <= 45) return "medium";
  return "low";
}
