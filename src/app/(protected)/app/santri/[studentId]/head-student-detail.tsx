"use client";

import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  GraduationCap,
  MapPin,
  NotebookPen,
  UserRound,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { HeadStudentDetail } from "@/modules/dashboard/application/head-dashboard-service";

const CATEGORY_LABELS = {
  SABAQ: "Sabaq",
  SABQI: "Sabqi",
  MANZIL: "Manzil",
} as const;

const FLUENCY_LABELS = {
  FLUENT: "Lancar",
  FAIRLY_FLUENT: "Cukup Lancar",
  LESS_FLUENT: "Kurang Lancar",
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

export function HeadStudentDetailView({
  student,
}: {
  student: HeadStudentDetail;
}) {
  const summaryCards = [
    {
      label: "Setoran aktif",
      value: student.activeRecordCount,
      icon: NotebookPen,
      tone: "bg-primary text-primary-foreground",
    },
    {
      label: "Sabaq",
      value: student.categoryCounts.SABAQ,
      icon: BookOpenCheck,
      tone: "bg-secondary text-secondary-foreground",
    },
    {
      label: "Sabqi",
      value: student.categoryCounts.SABQI,
      icon: GraduationCap,
      tone: "bg-accent text-accent-foreground",
    },
    {
      label: "Manzil",
      value: student.categoryCounts.MANZIL,
      icon: BookOpenCheck,
      tone: "bg-muted text-foreground",
    },
  ];

  return (
    <>
      <div className="mb-7 flex items-start gap-3">
        <Button asChild variant="outline" size="icon" title="Kembali">
          <Link href="/app" aria-label="Kembali ke Beranda">
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="mb-2 text-sm font-medium text-primary">Monitoring Akademik</p>
          <h1 className="truncate text-2xl font-semibold">{student.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nomor santri {student.studentNumber} · Bergabung {formatDate(student.joinedAt)}
          </p>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan setoran">
        {summaryCards.map((summary) => {
          const Icon = summary.icon;

          return (
            <Card key={summary.label} size="sm" className="border shadow-sm">
              <CardContent className="flex items-center gap-3">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-[8px] ${summary.tone}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{summary.value}</p>
                  <p className="text-sm text-muted-foreground">{summary.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <Card className="border shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="size-5 text-primary" aria-hidden="true" />
              Ringkasan Santri
            </CardTitle>
            <CardDescription>Data akademik aktif hingga hari ini.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
            <DetailItem
              icon={MapPin}
              label="Halaqah saat ini"
              value={student.currentHalaqahName ?? "Belum ditempatkan"}
            />
            <DetailItem
              icon={CalendarDays}
              label="Setoran terakhir"
              value={
                student.lastRecord
                  ? formatDate(student.lastRecord.submissionDate)
                  : "Belum pernah tercatat"
              }
            />
            <DetailItem
              icon={BookOpenCheck}
              label="Kelancaran terakhir"
              value={
                student.lastRecord
                  ? FLUENCY_LABELS[student.lastRecord.fluencyPredicate]
                  : "Belum ada penilaian"
              }
            />
            <DetailItem
              icon={NotebookPen}
              label="Total setoran aktif"
              value={`${student.activeRecordCount} setoran`}
            />
          </CardContent>
        </Card>

        <AttentionCard reasons={student.attentionReasons} />
      </section>

      <section className="mt-8" aria-labelledby="recent-records-heading">
        <div className="mb-4">
          <h2 id="recent-records-heading" className="text-lg font-semibold">
            Setoran Terbaru
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Maksimal 10 setoran aktif terakhir. Buka detail untuk melihat catatan dan riwayat perubahan.
          </p>
        </div>
        <RecentRecords records={student.recentRecords} />
      </section>
    </>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words font-medium">{value}</p>
      </div>
    </div>
  );
}

function AttentionCard({
  reasons,
}: {
  reasons: HeadStudentDetail["attentionReasons"];
}) {
  const needsAttention = reasons.length > 0;

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {needsAttention ? (
            <CircleAlert className="size-5 text-destructive" aria-hidden="true" />
          ) : (
            <CircleCheck className="size-5 text-primary" aria-hidden="true" />
          )}
          Perhatian
        </CardTitle>
        <CardDescription>
          {needsAttention ? "Perlu tindak lanjut dari halaqah." : "Tidak ada perhatian khusus saat ini."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {needsAttention ? (
          <div className="flex flex-wrap gap-2">
            {reasons.map((reason) => (
              <Badge key={reason} variant={reason === "LESS_FLUENT" ? "destructive" : "outline"}>
                {ATTENTION_REASON_LABELS[reason]}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Pantauan memakai setoran aktif terakhir hingga hari ini.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RecentRecords({
  records,
}: {
  records: HeadStudentDetail["recentRecords"];
}) {
  if (records.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-[8px] border border-dashed bg-card px-4 text-center">
        <NotebookPen className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">Belum ada setoran aktif</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Setoran yang dicatat Pengajar akan tampil di sini.
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
                  <TableHead className="pl-4">Tanggal</TableHead>
                  <TableHead>Setoran</TableHead>
                  <TableHead>Kelancaran</TableHead>
                  <TableHead>Halaqah</TableHead>
                  <TableHead className="pr-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="pl-4 text-muted-foreground">
                      {formatDate(record.submissionDate)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {CATEGORY_LABELS[record.submissionCategory]} · {record.surahName} {record.startVerse}-{record.endVerse}
                      </p>
                      <p className="text-sm text-muted-foreground">{record.teacherName}</p>
                    </TableCell>
                    <TableCell>{FLUENCY_LABELS[record.fluencyPredicate]}</TableCell>
                    <TableCell>{record.halaqahName}</TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/app/riwayat-setoran/${record.id}`}>Lihat</Link>
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
        {records.map((record) => (
          <Card key={record.id} size="sm" className="border shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate">
                    {CATEGORY_LABELS[record.submissionCategory]} · {record.surahName} {record.startVerse}-{record.endVerse}
                  </CardTitle>
                  <CardDescription>{formatDate(record.submissionDate)} · {record.halaqahName}</CardDescription>
                </div>
                <Badge variant={record.fluencyPredicate === "LESS_FLUENT" ? "destructive" : "secondary"}>
                  {FLUENCY_LABELS[record.fluencyPredicate]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Pengajar: {record.teacherName}</p>
              <Button asChild variant="outline" className="mt-3 w-full">
                <Link href={`/app/riwayat-setoran/${record.id}`}>Lihat Detail Setoran</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
