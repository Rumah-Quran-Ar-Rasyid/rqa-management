import type { Metadata } from "next";
import { ArrowRight, CircleCheck, NotebookPen, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RoleCode } from "@/generated/prisma/enums";
import { requireUser } from "@/modules/auth/application/session";
import { canAccessUserDirectory } from "@/modules/users/domain/user-management-policy";
import { canCreateMemorizationRecord } from "@/modules/memorization/domain/memorization-policy";

export const metadata: Metadata = {
  title: "Beranda",
};

const ROLE_LABELS: Record<RoleCode, string> = {
  ADMIN: "Admin",
  HEAD: "Kepala",
  TEACHER: "Pengajar",
};

export default async function AppPage() {
  const user = await requireUser();
  const canManageUsers = canAccessUserDirectory(user.roles);
  const canCreateMemorization = canCreateMemorizationRecord(user.roles);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Beranda</p>
          <h1 className="text-2xl font-semibold">Selamat datang, {user.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Akun Anda siap digunakan.
          </p>
        </div>
        {canCreateMemorization ? (
          <Button asChild>
            <Link href="/app/setoran">
              <NotebookPen aria-hidden="true" />
              Catat Setoran
            </Link>
          </Button>
        ) : canManageUsers ? (
          <Button asChild>
            <Link href="/app/pengguna">
              <UsersRound aria-hidden="true" />
              Kelola Pengguna
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:max-w-4xl">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-[8px] bg-accent text-accent-foreground">
              <CircleCheck className="size-5" aria-hidden="true" />
            </div>
            <CardTitle>Akun aktif</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-[8px] bg-secondary text-secondary-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <CardTitle>Akses</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2" aria-label="Daftar akses">
              {user.roles.map((role) => (
                <li
                  key={role}
                  className="rounded-[6px] border bg-muted px-2.5 py-1 text-sm font-medium"
                >
                  {ROLE_LABELS[role]}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {canManageUsers ? (
        <div className="mt-8 border-t pt-5 text-sm text-muted-foreground">
          <Link
            href="/app/pengguna"
            className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
          >
            Lihat akses pengguna
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </main>
  );
}
