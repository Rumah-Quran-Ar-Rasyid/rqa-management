"use client";

import {
  CircleAlert,
  CircleCheck,
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  Layers3,
  ListFilter,
  RotateCcw,
  School,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AttentionStudent,
  HeadDashboardActivity,
  HeadDashboardData,
} from "@/modules/dashboard/application/head-dashboard-service";

const CATEGORY_LABELS = {
  SABAQ: "Sabaq",
  SABQI: "Sabqi",
  MANZIL: "Manzil",
} as const;

const ATTENTION_REASON_LABELS = {
  NO_RECENT_RECORD: "Belum ada setoran 7 hari",
  LESS_FLUENT: "Setoran terakhir Kurang Lancar",
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

      <Card className="mb-6 border shadow-sm">
        <CardContent>
          <form
            action="/app"
            className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-end"
          >
            <FieldGroup className="contents">
              <Field>
                <FieldLabel htmlFor="dashboard-period">Periode</FieldLabel>
                <Select
                  id="dashboard-period"
                  name="academicPeriodId"
                  defaultValue={data.filters.academicPeriodId ?? ""}
                >
                  <option value="">Semua periode</option>
                  {data.periodOptions.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="dashboard-halaqah">Halaqah</FieldLabel>
                <Select
                  id="dashboard-halaqah"
                  name="halaqahId"
                  defaultValue={data.filters.halaqahId ?? ""}
                >
                  <option value="">Semua halaqah</option>
                  {data.halaqahOptions.map((halaqah) => (
                    <option key={halaqah.id} value={halaqah.id}>
                      {halaqah.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </FieldGroup>
            <Button type="submit" className="w-full sm:w-auto">
              <ListFilter aria-hidden="true" />
              Terapkan
            </Button>
            <Button asChild type="button" variant="outline" className="w-full sm:w-auto">
              <Link href="/app">
                <RotateCcw aria-hidden="true" />
                Reset
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>

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

      <section className="mt-7" aria-labelledby="attention-students-heading">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="attention-students-heading" className="text-lg font-semibold">
              Santri Perlu Perhatian
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Santri aktif yang belum memiliki setoran 7 hari atau setoran terakhirnya
              Kurang Lancar.
            </p>
          </div>
          {data.attentionStudents.length > 0 ? (
            <Badge variant="destructive" className="w-fit">
              {data.attentionStudents.length} perlu perhatian
            </Badge>
          ) : null}
        </div>
        <AttentionStudents students={data.attentionStudents} />
      </section>
    </>
  );
}

function AttentionStudents({
  students,
}: {
  students: AttentionStudent[];
}) {
  if (students.length === 0) {
    return (
      <div className="flex min-h-44 flex-col items-center justify-center rounded-[8px] border border-dashed bg-card px-4 text-center">
        <CircleCheck className="mb-3 size-5 text-primary" aria-hidden="true" />
        <p className="font-medium">Belum ada santri yang perlu perhatian</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pantauan setoran aktif akan diperbarui otomatis di sini.
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
                  <TableHead>Setoran terakhir</TableHead>
                  <TableHead className="pr-4">Alasan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="pl-4 font-medium">
                      <Link
                        href={`/app/santri/${student.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {student.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.lastSubmissionDate
                        ? formatDate(student.lastSubmissionDate)
                        : "Belum pernah tercatat"}
                    </TableCell>
                    <TableCell className="pr-4">
                      <AttentionReasonBadges reasons={student.reasons} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-3 md:hidden">
        {students.map((student) => (
          <Card key={student.id} size="sm" className="border shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="min-w-0 truncate">
                  <Link href={`/app/santri/${student.id}`} className="hover:text-primary">
                    {student.name}
                  </Link>
                </CardTitle>
                <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
              </div>
              <CardDescription>
                {student.lastSubmissionDate
                  ? `Setoran terakhir ${formatDate(student.lastSubmissionDate)}`
                  : "Belum pernah memiliki setoran"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttentionReasonBadges reasons={student.reasons} />
              <Button asChild variant="outline" className="mt-3 w-full">
                <Link href={`/app/santri/${student.id}`}>Lihat Detail Santri</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function AttentionReasonBadges({
  reasons,
}: {
  reasons: AttentionStudent["reasons"];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {reasons.map((reason) => (
        <Badge key={reason} variant={reason === "LESS_FLUENT" ? "destructive" : "outline"}>
          {ATTENTION_REASON_LABELS[reason]}
        </Badge>
      ))}
    </div>
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
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="pr-4 text-right">Aksi</TableHead>
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
                    <TableCell className="text-muted-foreground">
                      {formatDate(activity.submissionDate)}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/app/riwayat-setoran/${activity.id}`}>Lihat</Link>
                      </Button>
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
              <Button asChild variant="outline" className="mt-3 w-full">
                <Link href={`/app/riwayat-setoran/${activity.id}`}>Lihat Detail</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
