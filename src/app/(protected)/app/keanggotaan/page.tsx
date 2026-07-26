import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/auth/application/session";
import {
  canAccessHalaqahMemberships,
  canManageHalaqahMemberships,
} from "@/modules/memberships/domain/halaqah-membership-policy";
import { getHalaqahMembershipDirectory } from "@/modules/memberships/application/halaqah-membership-service";
import { HalaqahMembershipManagement } from "./halaqah-membership-management";

export const metadata: Metadata = {
  title: "Keanggotaan Halaqah",
};

export default async function HalaqahMembershipsPage() {
  const actor = await requireUser();

  if (!canAccessHalaqahMemberships(actor.roles)) {
    notFound();
  }

  const directory = await getHalaqahMembershipDirectory(actor);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <HalaqahMembershipManagement
        canManage={canManageHalaqahMemberships(actor.roles)}
        {...directory}
      />
    </main>
  );
}
