import type { FluencyPredicate } from "@/generated/prisma/enums";

export type AttentionReason = "NO_RECENT_RECORD" | "LESS_FLUENT";

export function attentionReasons({
  lastFluencyPredicate,
  lastSubmissionDate,
  today,
}: {
  lastFluencyPredicate: FluencyPredicate | null;
  lastSubmissionDate: string | null;
  today: string;
}): AttentionReason[] {
  const reasons: AttentionReason[] = [];

  if (!lastSubmissionDate || lastSubmissionDate <= sevenDaysBefore(today)) {
    reasons.push("NO_RECENT_RECORD");
  }

  if (lastFluencyPredicate === "LESS_FLUENT") {
    reasons.push("LESS_FLUENT");
  }

  return reasons;
}

export function sevenDaysBefore(today: string) {
  const result = new Date(`${today}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() - 7);
  return result.toISOString().slice(0, 10);
}
