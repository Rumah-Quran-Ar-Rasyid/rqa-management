import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/modules/auth/application/actions";
import { requireUser } from "@/modules/auth/application/session";
import { canAccessUserDirectory } from "@/modules/users/domain/user-management-policy";
import { AppBrand, AppNavigation } from "./app-navigation";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  const canAccessUsers = canAccessUserDirectory(user.roles);

  return (
    <div className="min-h-svh bg-muted/35 lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="hidden border-r bg-card lg:flex lg:min-h-svh lg:flex-col lg:p-4">
        <AppBrand />
        <div className="my-7 h-px bg-border" />
        <AppNavigation canAccessUserDirectory={canAccessUsers} variant="desktop" />
        <div className="mt-auto border-t pt-4">
          <div className="mb-3 min-w-0 px-3">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" className="w-full justify-start">
              <LogOut aria-hidden="true" />
              Keluar
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="border-b bg-card lg:hidden">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4">
            <AppBrand />
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
          <AppNavigation canAccessUserDirectory={canAccessUsers} variant="mobile" />
        </header>
        <div className="hidden h-16 items-center border-b bg-card px-8 lg:flex">
          <p className="text-sm text-muted-foreground">Rumah Qur’an Ar-Rasyid</p>
        </div>
        {children}
      </div>
    </div>
  );
}
