"use client";

import { BookOpenText, LayoutDashboard, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigation = [
  {
    href: "/app",
    label: "Beranda",
    icon: LayoutDashboard,
    requiresUserDirectory: false,
  },
  {
    href: "/app/pengguna",
    label: "Pengguna",
    icon: UsersRound,
    requiresUserDirectory: true,
  },
] as const;

export function AppBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-primary text-primary-foreground shadow-sm">
        <BookOpenText className="size-5" aria-hidden="true" />
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            Rumah Qur’an Ar-Rasyid
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Ruang kerja internal
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function AppNavigation({
  canAccessUserDirectory,
  variant,
}: {
  canAccessUserDirectory: boolean;
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className={cn(
        variant === "desktop"
          ? "flex flex-col gap-1"
          : "flex items-center gap-1 overflow-x-auto px-4 py-2",
      )}
    >
      {navigation
        .filter(
          (item) => !item.requiresUserDirectory || canAccessUserDirectory,
        )
        .map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-[8px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                variant === "desktop" ? "h-11 px-3" : "h-10 px-3",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
