import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/auth/application/session";
import { getMemorizationEntryContext } from "@/modules/memorization/application/memorization-service";
import { canCreateMemorizationRecord } from "@/modules/memorization/domain/memorization-policy";
import { MemorizationEntry } from "./memorization-entry";

export const metadata: Metadata = {
  title: "Catat Setoran",
};

export default async function MemorizationEntryPage() {
  const actor = await requireUser();

  if (!canCreateMemorizationRecord(actor.roles)) {
    notFound();
  }

  const context = await getMemorizationEntryContext(actor);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <MemorizationEntry {...context} />
    </main>
  );
}
