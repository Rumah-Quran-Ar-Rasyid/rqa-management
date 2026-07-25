import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/auth/application/session";
import {
  getMemorizationRecordDetail,
  MemorizationError,
} from "@/modules/memorization/application/memorization-service";
import { MemorizationRecordDetailView } from "./memorization-record-detail";

export const metadata: Metadata = {
  title: "Detail Setoran",
};

export default async function MemorizationRecordDetailPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const actor = await requireUser();
  const { recordId } = await params;

  let record;

  try {
    record = await getMemorizationRecordDetail(actor, recordId);
  } catch (error) {
    if (error instanceof MemorizationError) {
      notFound();
    }

    throw error;
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <MemorizationRecordDetailView record={record} />
    </main>
  );
}
