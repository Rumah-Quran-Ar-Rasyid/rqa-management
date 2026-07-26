import type { Metadata } from "next";
import { BookOpenText } from "lucide-react";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/modules/auth/application/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
};

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/app");
  }

  return (
    <main className="grid min-h-svh bg-muted/35 lg:grid-cols-[minmax(0,0.95fr)_minmax(28rem,0.75fr)]">
      <section className="hidden border-r bg-card p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-primary text-primary-foreground shadow-sm">
            <BookOpenText className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold">Rumah Qur’an Ar-Rasyid</p>
            <p className="text-sm text-muted-foreground">
              Pencatatan hafalan santri
            </p>
          </div>
        </div>
        <div className="max-w-md">
          <p className="mb-3 text-sm font-medium text-primary">
            Ruang kerja internal
          </p>
          <h1 className="text-3xl font-semibold leading-tight">
            Rumah Qur’an Ar-Rasyid
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Pencatatan hafalan santri.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Rumah Qur’an Ar-Rasyid
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-primary text-primary-foreground shadow-sm">
              <BookOpenText className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">Rumah Qur’an Ar-Rasyid</p>
              <p className="text-sm text-muted-foreground">
                Pencatatan hafalan santri
              </p>
            </div>
          </div>
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-primary">Masuk ke ruang kerja</p>
            <h1 className="text-2xl font-semibold">Selamat datang</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Akses untuk Admin, Kepala, dan Pengajar.
            </p>
          </div>
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>
                <h2 className="text-lg font-semibold">Masuk</h2>
              </CardTitle>
              <CardDescription>
                Gunakan akun operasional Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
