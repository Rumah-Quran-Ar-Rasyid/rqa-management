"use client";

import {
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  Layers3,
  School,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  HeadDashboardActivity,
  HeadDashboardData,
} from "@/modules/dashboard/application/head-dashboard-service";

const CATEGORY_LABELS = {
  SABAQ: "Sabaq",
  SABQI: "Sabqi",
  MANZIL: "Manzil",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function HeadDashboard({
  data,
  name,
}: {
  data: HeadDashboardData;
  name: string;
}) {
  const summaryCards = [
    {
      label: "Setoran hari ini",
      value: data.todayRecordCount,
      icon: BookOpenCheck,
      tone: "bg-primary text-primary-foreground",
    },
    {
      label: "Setoran minggu ini",
      value: data.weekRecordCount,
      icon: CalendarDays,
      tone: "bg-secondary text-secondary-foreground",
    },
    {
      label: "Santri aktif",
      value: data.activeStudentCount,
      icon: UsersRound,
      tone: "bg-accent text-accent-foreground",
    },
    {
      label: "Halaqah aktif",
      value: data.activeHalaqahCount,
      icon: School,
      tone: "bg-muted text-foreground",
    },
  ];

  return (
    <>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Monitoring Akademik</p>
          <h1 className="text-2xl font-semibold">Assalamu&apos;alaikum, {name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan setoran Rumah Qur&apos;an Ar-Rasyid per {formatDate(data.today)}.
          </p>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan setoran">
        {summaryCards.map((summary) => {
          const Icon = summary.icon;

          return (
            <Card key={summary.label} size="sm" className="border shadow-sm">
              <CardContent className="flex items-center gap-3">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-[8px] ${summary.tone}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-semibold tabular-nums">{summary.value}</p>
                  <p className="text-sm text-muted-foreground">{summary.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-7 grid gap-7 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers3 className="size-5 text-primary" aria-hidden="true" />
              Kategori Mingguan
            </CardTitle>
            <CardDescription>Akumulasi sejak Senin minggu berjalan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(data.categoryCounts).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                </span>
                <span className="text-lg font-semibold tabular-nums">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Aktivitas Terbaru</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Setoran aktif terbaru dari seluruh halaqah.
            </p>
          </div>
          <RecentActivities activities={data.recentActivities} />
        </section>
      </section>
    </>
  );
}

function RecentActivities({
  activities,
}: {
  activities: HeadDashboardActivity[];
}) {
  if (activities.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-[8px] border border-dashed bg-card px-4 text-center">
        <GraduationCap className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">Belum ada setoran</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Aktivitas Pengajar akan tampil di sini setelah setoran dicatat.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Card className="border py-0 shadow-sm">
          <CardContent className="px-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-4">Santri</TableHead>
                  <TableHead>Setoran</TableHead>
                  <TableHead>Pengajar</TableHead>
                  <TableHead className="pr-4">Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="pl-4">
                      <p className="font-medium">{activity.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.halaqahName}
                      </p>
                    </TableCell>
                    <TableCell>
                      {CATEGORY_LABELS[activity.submissionCategory]} · {activity.surahName} {activity.startVerse}-{activity.endVerse}
                    </TableCell>
                    <TableCell>{activity.teacherName}</TableCell>
                    <TableCell className="pr-4 text-muted-foreground">
                      {formatDate(activity.submissionDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-3 md:hidden">
        {activities.map((activity) => (
          <Card key={activity.id} size="sm" className="border shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate">{activity.studentName}</CardTitle>
                  <CardDescription>{activity.halaqahName}</CardDescription>
                </div>
                <Badge variant="secondary">
                  {CATEGORY_LABELS[activity.submissionCategory]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p>{activity.surahName} {activity.startVerse}-{activity.endVerse}</p>
              <p className="text-muted-foreground">
                {activity.teacherName} · {formatDate(activity.submissionDate)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
