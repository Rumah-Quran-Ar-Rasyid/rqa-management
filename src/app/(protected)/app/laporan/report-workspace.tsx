"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpenCheck, Download, FileText, Printer, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  generateReportAction,
  previewReportAction,
} from "@/modules/reports/application/report-actions";
import type {
  ReportDirectory,
  ReportPreview as ReportPreviewData,
} from "@/modules/reports/application/report-service";
import {
  reportRequestSchema,
  type ReportRequestFormInput,
  type ReportRequestInput,
} from "@/modules/reports/domain/report-schemas";

const CATEGORY_LABELS = { SABAQ: "Sabaq", SABQI: "Sabqi", MANZIL: "Manzil" } as const;
const FLUENCY_LABELS = {
  FLUENT: "Lancar",
  FAIRLY_FLUENT: "Cukup Lancar",
  LESS_FLUENT: "Kurang Lancar",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function ReportWorkspace({ directory }: { directory: ReportDirectory }) {
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<ReportPreviewData | null>(null);
  const [generatedReport, setGeneratedReport] = useState<{
    id: string;
    number: string;
    version: number;
  } | null>(null);
  const form = useForm<ReportRequestFormInput, unknown, ReportRequestInput>({
    resolver: zodResolver(reportRequestSchema),
    defaultValues: {
      studentId: "",
      selectionType: "ACADEMIC_PERIOD",
      academicPeriodId: directory.defaultAcademicPeriodId ?? "",
      periodStart: "",
      periodEnd: "",
      supersedesReportId: "",
    },
  });
  const selectionType = useWatch({ control: form.control, name: "selectionType" });
  const supersedesReportId = useWatch({
    control: form.control,
    name: "supersedesReportId",
  });

  function handlePreview(values: ReportRequestInput) {
    setGeneratedReport(null);
    setPreview(null);
    startTransition(async () => {
      const result = await previewReportAction(values);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setPreview(result.preview);
      form.setValue("supersedesReportId", "");
      toast.success("Pratinjau laporan siap diperiksa.");
    });
  }

  function handleGenerate() {
    form.handleSubmit((values) => {
      startTransition(async () => {
        const result = await generateReportAction(values);
        if (!result.success) {
          toast.error(result.message);
          return;
        }
        setGeneratedReport({
          id: result.reportId,
          number: result.reportNumber,
          version: result.version,
        });
        toast.success(result.message);
      });
    })();
  }

  return (
    <>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-primary">Laporan Perkembangan</p>
        <h1 className="text-2xl font-semibold">Laporan Santri</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih santri dan periode, periksa pratinjau, lalu buat PDF untuk dibagikan atau dicetak.
        </p>
      </div>

      <div className="grid gap-7 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="h-fit border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="size-5 text-primary" aria-hidden="true" />
              Buat Laporan
            </CardTitle>
            <CardDescription>Setoran yang dibatalkan tidak dimasukkan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={form.handleSubmit(handlePreview)}>
              <FieldGroup>
                <Field data-invalid={Boolean(form.formState.errors.studentId)}>
                  <FieldLabel htmlFor="report-student">Santri</FieldLabel>
                  <Select id="report-student" {...form.register("studentId")}>
                    <option value="">Pilih santri</option>
                    {directory.students.map((student) => (
                      <option key={student.id} value={student.id}>{student.label}</option>
                    ))}
                  </Select>
                  <FieldError errors={[form.formState.errors.studentId]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="report-selection-type">Dasar laporan</FieldLabel>
                  <Select id="report-selection-type" {...form.register("selectionType")}>
                    <option value="ACADEMIC_PERIOD">Periode pembelajaran</option>
                    <option value="CUSTOM_RANGE">Rentang tanggal</option>
                  </Select>
                </Field>
                {selectionType === "ACADEMIC_PERIOD" ? (
                  <Field data-invalid={Boolean(form.formState.errors.academicPeriodId)}>
                    <FieldLabel htmlFor="report-period">Periode pembelajaran</FieldLabel>
                    <Select id="report-period" {...form.register("academicPeriodId")}>
                      <option value="">Pilih periode</option>
                      {directory.academicPeriods.map((period) => (
                        <option key={period.id} value={period.id}>{period.label}</option>
                      ))}
                    </Select>
                    <FieldError errors={[form.formState.errors.academicPeriodId]} />
                  </Field>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <Field data-invalid={Boolean(form.formState.errors.periodStart)}>
                      <FieldLabel htmlFor="report-period-start">Tanggal mulai</FieldLabel>
                      <Input id="report-period-start" type="date" {...form.register("periodStart")} />
                      <FieldError errors={[form.formState.errors.periodStart]} />
                    </Field>
                    <Field data-invalid={Boolean(form.formState.errors.periodEnd)}>
                      <FieldLabel htmlFor="report-period-end">Tanggal selesai</FieldLabel>
                      <Input id="report-period-end" type="date" {...form.register("periodEnd")} />
                      <FieldError errors={[form.formState.errors.periodEnd]} />
                    </Field>
                  </div>
                )}
              </FieldGroup>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <BookOpenCheck aria-hidden="true" />}
                Tampilkan Pratinjau
              </Button>
            </form>
          </CardContent>
        </Card>

        <ReportPreview
          preview={preview}
          isPending={isPending}
          generatedReport={generatedReport}
          supersedesReportId={
            typeof supersedesReportId === "string" ? supersedesReportId : undefined
          }
          onReplaceChange={(checked) =>
            form.setValue(
              "supersedesReportId",
              checked ? preview?.currentReport?.id ?? "" : "",
            )
          }
          onGenerate={handleGenerate}
        />
      </div>
    </>
  );
}

function ReportPreview({
  preview,
  isPending,
  generatedReport,
  supersedesReportId,
  onReplaceChange,
  onGenerate,
}: {
  preview: ReportPreviewData | null;
  isPending: boolean;
  generatedReport: { id: string; number: string; version: number } | null;
  supersedesReportId: string | undefined;
  onReplaceChange: (checked: boolean) => void;
  onGenerate: () => void;
}) {
  if (!preview) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center rounded-[8px] border border-dashed bg-card px-5 text-center">
        <FileText className="mb-3 size-6 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">Pratinjau laporan akan tampil di sini</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Pilih santri dan periode untuk melihat ringkasan serta riwayat setoran sebelum membuat PDF.
        </p>
      </div>
    );
  }

  const replaceCurrentReport = Boolean(supersedesReportId);
  const generateLabel = replaceCurrentReport
    ? "Terbitkan Versi Pembaruan"
    : preview.currentReport
      ? "Gunakan Laporan Berlaku"
      : "Terbitkan Laporan";

  return (
    <section aria-labelledby="report-preview-heading">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="report-preview-heading" className="text-lg font-semibold">Pratinjau Laporan</h2>
          <p className="mt-1 text-sm text-muted-foreground">Data ini akan menjadi snapshot resmi saat laporan diterbitkan.</p>
        </div>
        <Button onClick={onGenerate} disabled={isPending} className="w-full sm:w-auto">
          {isPending ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
          {generateLabel}
        </Button>
      </div>

      {preview.currentReport ? (
        <Card className="mb-5 border shadow-sm">
          <CardContent className="py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Laporan berlaku versi {preview.currentReport.version}</p>
                <p className="text-sm text-muted-foreground">
                  {preview.currentReport.reportNumber} · diterbitkan {formatDate(preview.currentReport.issuedAt.slice(0, 10))}
                </p>
              </div>
              <label className="flex cursor-pointer items-start gap-3 text-sm sm:max-w-72">
                <input
                  type="checkbox"
                  checked={replaceCurrentReport}
                  onChange={(event) => onReplaceChange(event.target.checked)}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span>
                  Terbitkan versi pembaruan dan tandai laporan berlaku sebagai digantikan.
                </span>
              </label>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {generatedReport ? (
        <Card className="mb-5 border-primary/30 bg-primary/5 shadow-sm">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">PDF siap diunduh</p>
              <p className="text-sm text-muted-foreground">
                {generatedReport.number} · versi {generatedReport.version}
              </p>
            </div>
            <div className="grid gap-2 sm:flex">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={`/api/reports/${generatedReport.id}?download=1`}>
                  <Download aria-hidden="true" />
                  Unduh PDF
                </Link>
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/api/reports/${generatedReport.id}`} target="_blank">
                  <Printer aria-hidden="true" />
                  Buka untuk Cetak
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{preview.snapshot.student.name}</CardTitle>
              <CardDescription>Nomor santri {preview.snapshot.student.studentNumber}</CardDescription>
            </div>
            <Badge variant="secondary">{preview.snapshot.periodLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Summary label="Setoran aktif" value={preview.snapshot.summary.totalRecords} />
            <Summary label="Sabaq" value={preview.snapshot.summary.categories.SABAQ} />
            <Summary label="Sabqi" value={preview.snapshot.summary.categories.SABQI} />
            <Summary label="Manzil" value={preview.snapshot.summary.categories.MANZIL} />
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="text-muted-foreground">Rentang:</span> {formatDate(preview.snapshot.periodStart)} - {formatDate(preview.snapshot.periodEnd)}</p>
            <p><span className="text-muted-foreground">Halaqah:</span> {preview.snapshot.halaqahNames.join(", ")}</p>
            <p><span className="text-muted-foreground">Pengajar:</span> {preview.snapshot.teacherNames.join(", ")}</p>
            <p><span className="text-muted-foreground">Kelancaran:</span> Lancar {preview.snapshot.summary.fluencies.FLUENT}, Cukup Lancar {preview.snapshot.summary.fluencies.FAIRLY_FLUENT}, Kurang Lancar {preview.snapshot.summary.fluencies.LESS_FLUENT}</p>
          </div>
          <div>
            <h3 className="mb-3 font-medium">Riwayat Setoran</h3>
            <div className="space-y-3">
              {preview.snapshot.records.map((record) => (
                <div key={record.id} className="rounded-[8px] border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{CATEGORY_LABELS[record.submissionCategory]} · {record.surahName} {record.startVerse}-{record.endVerse}</p>
                    <Badge variant={record.fluencyPredicate === "LESS_FLUENT" ? "destructive" : "secondary"}>{FLUENCY_LABELS[record.fluencyPredicate]}</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{formatDate(record.submissionDate)} · {record.halaqahName} · {record.teacherName}</p>
                  {record.teacherNote ? <p className="mt-2">Catatan: {record.teacherNote}</p> : null}
                  {record.nextTarget ? <p className="mt-1">Target berikutnya: {record.nextTarget}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] bg-muted/55 p-3">
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
