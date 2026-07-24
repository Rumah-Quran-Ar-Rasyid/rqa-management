import type { Metadata } from "next";
import { CircleCheck, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RoleCode } from "@/generated/prisma/enums";
import { requireUser } from "@/modules/auth/application/session";

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

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="mb-1 text-sm text-muted-foreground">Selamat datang</p>
        <h1 className="text-2xl font-semibold">{user.name}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-[8px] bg-accent text-accent-foreground">
              <CircleCheck className="size-5" aria-hidden="true" />
            </div>
            <CardTitle>Akun aktif</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
        </Card>

        <Card>
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
    </main>
  );
}
