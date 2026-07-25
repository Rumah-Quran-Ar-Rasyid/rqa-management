import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/auth/application/session";
import { getMemorizationEntryContext } from "@/modules/memorization/application/memorization-service";
import {
  parseMemorizationHistoryFilters,
  type MemorizationHistorySearchParams,
} from "@/modules/memorization/domain/memorization-history-filter";
import { canCreateMemorizationRecord } from "@/modules/memorization/domain/memorization-policy";
import { MemorizationEntry } from "./memorization-entry";

export const metadata: Metadata = {
  title: "Catat Setoran",
};

export default async function MemorizationEntryPage({
  searchParams,
}: {
  searchParams: Promise<MemorizationHistorySearchParams>;
}) {
  const actor = await requireUser();

  if (!canCreateMemorizationRecord(actor.roles)) {
    notFound();
  }

  const filters = parseMemorizationHistoryFilters(await searchParams);
  const context = await getMemorizationEntryContext(actor, filters);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <MemorizationEntry {...context} />
    </main>
  );
}
