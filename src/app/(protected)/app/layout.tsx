import { BookOpenText, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/modules/auth/application/actions";
import { requireUser } from "@/modules/auth/application/session";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-primary text-primary-foreground">
              <BookOpenText className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                Rumah Qur’an Ar-Rasyid
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.name}
              </p>
            </div>
          </div>

          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              size="icon"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut aria-hidden="true" />
            </Button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
