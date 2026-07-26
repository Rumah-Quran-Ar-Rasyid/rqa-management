import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/auth/application/session";
import {
  canAccessHalaqahDirectory,
  canManageHalaqahs,
} from "@/modules/halaqahs/domain/halaqah-policy";
import { listHalaqahs } from "@/modules/halaqahs/application/halaqah-service";
import { HalaqahManagement } from "./halaqah-management";

export const metadata: Metadata = {
  title: "Halaqah",
};

export default async function HalaqahsPage() {
  const actor = await requireUser();

  if (!canAccessHalaqahDirectory(actor.roles)) {
    notFound();
  }

  const halaqahs = await listHalaqahs(actor);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <HalaqahManagement
        canManage={canManageHalaqahs(actor.roles)}
        halaqahs={halaqahs}
      />
    </main>
  );
}
