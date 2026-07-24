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
    <main className="flex min-h-svh items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-primary text-primary-foreground">
            <BookOpenText className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold">Rumah Qur’an Ar-Rasyid</p>
            <p className="text-sm text-muted-foreground">
              Pencatatan hafalan santri
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>
              <h1 className="text-lg font-semibold">Masuk</h1>
            </CardTitle>
            <CardDescription>
              Akses khusus Admin, Kepala, dan Pengajar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
