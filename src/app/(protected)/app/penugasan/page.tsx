import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/auth/application/session";
import {
  canAccessTeacherAssignments,
  canManageTeacherAssignments,
} from "@/modules/assignments/domain/teacher-assignment-policy";
import { getTeacherAssignmentDirectory } from "@/modules/assignments/application/teacher-assignment-service";
import { TeacherAssignmentManagement } from "./teacher-assignment-management";

export const metadata: Metadata = {
  title: "Penugasan",
};

export default async function TeacherAssignmentsPage() {
  const actor = await requireUser();

  if (!canAccessTeacherAssignments(actor.roles)) {
    notFound();
  }

  const directory = await getTeacherAssignmentDirectory(actor);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <TeacherAssignmentManagement
        canManage={canManageTeacherAssignments(actor.roles)}
        {...directory}
      />
    </main>
  );
}
