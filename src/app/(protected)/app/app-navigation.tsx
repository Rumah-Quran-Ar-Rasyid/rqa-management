"use client";

import {
  BookOpenText,
  CalendarDays,
  LayoutDashboard,
  School,
  UserRoundCheck,
  UserRoundPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigation = [
  {
    href: "/app",
    label: "Beranda",
    icon: LayoutDashboard,
    requiredAccess: "none",
  },
  {
    href: "/app/pengguna",
    label: "Pengguna",
    icon: UsersRound,
    requiredAccess: "users",
  },
  {
    href: "/app/periode",
    label: "Periode",
    icon: CalendarDays,
    requiredAccess: "periods",
  },
  {
    href: "/app/halaqah",
    label: "Halaqah",
    icon: School,
    requiredAccess: "halaqahs",
  },
  {
    href: "/app/santri",
    label: "Santri",
    icon: UserRound,
    requiredAccess: "students",
  },
  {
    href: "/app/penugasan",
    label: "Penugasan",
    icon: UserRoundCheck,
    requiredAccess: "assignments",
  },
  {
    href: "/app/keanggotaan",
    label: "Keanggotaan",
    icon: UserRoundPlus,
    requiredAccess: "memberships",
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
  canAccessAcademicPeriods,
  canAccessHalaqahs,
  canAccessStudents,
  canAccessTeacherAssignments,
  canAccessHalaqahMemberships,
  variant,
}: {
  canAccessUserDirectory: boolean;
  canAccessAcademicPeriods: boolean;
  canAccessHalaqahs: boolean;
  canAccessStudents: boolean;
  canAccessTeacherAssignments: boolean;
  canAccessHalaqahMemberships: boolean;
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
        .filter((item) => {
          if (item.requiredAccess === "users") {
            return canAccessUserDirectory;
          }

          if (item.requiredAccess === "periods") {
            return canAccessAcademicPeriods;
          }

          if (item.requiredAccess === "halaqahs") {
            return canAccessHalaqahs;
          }

          if (item.requiredAccess === "students") {
            return canAccessStudents;
          }

          if (item.requiredAccess === "assignments") {
            return canAccessTeacherAssignments;
          }

          return (
            item.requiredAccess !== "memberships" ||
            canAccessHalaqahMemberships
          );
        })
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
