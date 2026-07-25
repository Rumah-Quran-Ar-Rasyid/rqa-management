import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/auth/application/session";
import {
  canAccessStudentDirectory,
  canManageStudents,
} from "@/modules/students/domain/student-policy";
import { listStudents } from "@/modules/students/application/student-service";
import { StudentManagement } from "./student-management";

export const metadata: Metadata = {
  title: "Santri",
};

export default async function StudentsPage() {
  const actor = await requireUser();

  if (!canAccessStudentDirectory(actor.roles)) {
    notFound();
  }

  const students = await listStudents(actor);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <StudentManagement
        canManage={canManageStudents(actor.roles)}
        students={students}
      />
    </main>
  );
}
